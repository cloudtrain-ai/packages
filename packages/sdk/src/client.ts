import type { Agent, ChatOptions, ChatCompletion, CloudTrainConfig, CloudTrainError, ResponseFormat } from "./types";

export class CloudTrainAPIError extends Error {
    readonly status: number;
    readonly type: string;

    constructor(status: number, error: CloudTrainError["error"]) {
        super(error.message);
        this.name = "CloudTrainAPIError";
        this.status = status;
        this.type = error.type;
    }
}

export class CloudTrain {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly defaultTimeoutMs: number;
    private readonly fetch: typeof fetch;

    constructor(config: CloudTrainConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? "https://cloudtrain.ai").replace(/\/$/, "");
        this.defaultTimeoutMs = config.timeoutMs ?? 60_000;
        this.fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
    }

    private createTimeoutController(userSignal: AbortSignal | undefined, timeoutMs: number) {
        const controller = new AbortController();
        const onUserAbort = () => controller.abort();
        if (userSignal) userSignal.addEventListener("abort", onUserAbort, { once: true });
        const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
        const cleanup = () => {
            if (timeoutId !== null) clearTimeout(timeoutId);
            if (userSignal) userSignal.removeEventListener("abort", onUserAbort);
        };
        return { signal: controller.signal, cleanup, clearTimeoutOnly: () => { if (timeoutId !== null) clearTimeout(timeoutId); } };
    }

    private get headers(): Record<string, string> {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
        };
    }

    /**
     * Send a chat completion request and get the full response.
     *
     * When `response_format.type === "json_schema"` is set, the SDK auto-parses
     * each choice's `content` from a JSON string into the typed object `T`.
     * Specify `T` to type the parsed result, e.g. `chat<MySchema>({...})`.
     */
    async chat<T = string>(options: Omit<ChatOptions, "stream">): Promise<ChatCompletion<T>> {
        const { signal, cleanup } = this.createTimeoutController(options.signal, options.timeoutMs ?? this.defaultTimeoutMs);
        try {
            const response = await this.fetch(`${this.baseUrl}/api/v1/chat/completions`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    messages: options.messages,
                    stream: false,
                    meta: options.meta,
                    response_format: options.response_format,
                    conversation_id: options.conversation_id,
                }),
                signal,
            });

            if (!response.ok) {
                const body = await response.json() as CloudTrainError;
                throw new CloudTrainAPIError(response.status, body.error);
            }

            const completion = await (response.json() as Promise<ChatCompletion<string>>);

            if (options.response_format?.type === "json_schema") {
                return {
                    ...completion,
                    choices: completion.choices.map(choice => ({
                        ...choice,
                        message: {
                            ...choice.message,
                            content: JSON.parse(choice.message.content) as T,
                        },
                    })),
                };
            }

            return completion as ChatCompletion<T>;
        } finally {
            cleanup();
        }
    }

    /**
     * Send a chat completion request and stream the response text via callbacks.
     *
     * Callback-based primitive (vs an AsyncGenerator) to avoid requiring
     * `Symbol.asyncIterator` and regenerator runtime in restricted environments
     * (older React Native, non-Hermes JSC, etc.).
     *
     * When `response_format.type === "json_schema"`, chunks still fire as raw
     * text strings (so consumers can show progress) but `onComplete` receives
     * the buffered content auto-parsed as `T`. For text streams, `onComplete`
     * receives the joined string.
     *
     * Resolves when the stream completes naturally. Rejects with
     * `CloudTrainAPIError` on HTTP errors or `DOMException("AbortError")` when
     * aborted via signal/timeout. `onError` is also invoked for consumers that
     * prefer to handle errors via callback rather than `.catch()`.
     */
    async chatStream<T = string>(
        options: Omit<ChatOptions, "stream"> & {
            onChunk: (chunk: string) => void;
            onComplete?: (result: T) => void;
            onError?: (err: unknown) => void;
        },
    ): Promise<void> {
        const { signal, cleanup, clearTimeoutOnly } = this.createTimeoutController(options.signal, options.timeoutMs ?? this.defaultTimeoutMs);
        try {
            const response = await this.fetch(`${this.baseUrl}/api/v1/chat/completions`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    messages: options.messages,
                    stream: true,
                    meta: options.meta,
                    response_format: options.response_format,
                    conversation_id: options.conversation_id,
                }),
                signal,
            });

            // Response received - clear the timeout, user signal still wired for manual abort
            clearTimeoutOnly();

            if (!response.ok) {
                const body = await response.json() as CloudTrainError;
                throw new CloudTrainAPIError(response.status, body.error);
            }

            if (!response.body) {
                throw new Error("No response body available for streaming");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    options.onChunk(chunk);
                }
            } finally {
                reader.releaseLock();
            }
            const result = options.response_format?.type === "json_schema"
                ? JSON.parse(buffer) as T
                : buffer as unknown as T;
            options.onComplete?.(result);
        } catch (err) {
            options.onError?.(err);
            throw err;
        } finally {
            cleanup();
        }
    }

    /**
     * AsyncIterable convenience wrapper around `chatStream`. Yields text chunks
     * as they arrive. Useful in Node/web/modern environments — prefer the
     * callback `chatStream` for React Native and runtimes with limited
     * `Symbol.asyncIterator` support.
     */
    async *chatStreamIterable(options: Omit<ChatOptions, "stream">): AsyncGenerator<string, void, unknown> {
        const buffer: string[] = [];
        let done = false;
        let error: unknown = null;
        let resolveWaiter: (() => void) | null = null;
        const notify = () => {
            const r = resolveWaiter;
            resolveWaiter = null;
            r?.();
        };
        this.chatStream({
            ...options,
            onChunk: (chunk) => { buffer.push(chunk); notify(); },
            onComplete: () => { done = true; notify(); },
            onError: (err) => { error = err; done = true; notify(); },
        }).catch(() => {});
        while (true) {
            if (error) throw error;
            if (buffer.length) {
                yield buffer.shift()!;
            } else if (done) {
                return;
            } else {
                await new Promise<void>(r => { resolveWaiter = r; });
            }
        }
    }

    /**
     * Stream a structured (JSON Schema) response as progressively-completing
     * partial objects. CloudTrain extension — sends `stream_format: "partial-json"`
     * and parses SSE frames of the form `data: {"partial": {...}}`, terminated by
     * `data: [DONE]`.
     *
     * `onPartial` fires for every snapshot with the latest `Partial<T>`.
     * `onComplete` fires once with the final fully-formed `T` (the last partial
     * seen before `[DONE]`). Ideal for generative-UI patterns (form fields
     * filling in live, progressive lists, etc.).
     */
    async chatStreamPartial<T>(
        options: Omit<ChatOptions, "stream" | "response_format"> & {
            response_format: Extract<ResponseFormat, { type: "json_schema" }>;
            onPartial: (partial: Partial<T>) => void;
            onComplete?: (final: T) => void;
            onError?: (err: unknown) => void;
        },
    ): Promise<void> {
        const { signal, cleanup, clearTimeoutOnly } = this.createTimeoutController(options.signal, options.timeoutMs ?? this.defaultTimeoutMs);
        try {
            const response = await this.fetch(`${this.baseUrl}/api/v1/chat/completions`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    messages: options.messages,
                    stream: true,
                    stream_format: "partial-json",
                    meta: options.meta,
                    response_format: options.response_format,
                    conversation_id: options.conversation_id,
                }),
                signal,
            });

            clearTimeoutOnly();

            if (!response.ok) {
                const body = await response.json() as CloudTrainError;
                throw new CloudTrainAPIError(response.status, body.error);
            }

            if (!response.body) {
                throw new Error("No response body available for streaming");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let latest: Partial<T> | undefined;
            let terminated = false;
            try {
                while (!terminated) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    let sep: number;
                    while ((sep = buffer.indexOf("\n\n")) !== -1) {
                        const frame = buffer.slice(0, sep);
                        buffer = buffer.slice(sep + 2);
                        const line = frame.split("\n").find(l => l.startsWith("data:"));
                        if (!line) continue;
                        const payload = line.slice(5).trimStart();
                        if (payload === "[DONE]") { terminated = true; break; }
                        const parsed = JSON.parse(payload) as { partial: Partial<T> };
                        latest = parsed.partial;
                        options.onPartial(latest);
                    }
                }
            } finally {
                reader.releaseLock();
            }
            if (latest !== undefined) options.onComplete?.(latest as T);
        } catch (err) {
            options.onError?.(err);
            throw err;
        } finally {
            cleanup();
        }
    }

    /**
     * Fetch metadata for the agent associated with the current API key.
     */
    async getAgent(): Promise<Agent> {
        const response = await this.fetch(`${this.baseUrl}/api/v1/agent`, {
            method: "GET",
            headers: this.headers,
        });

        if (!response.ok) {
            const body = await response.json() as CloudTrainError;
            throw new CloudTrainAPIError(response.status, body.error);
        }

        return response.json() as Promise<Agent>;
    }
}
