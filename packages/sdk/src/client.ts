import type { Agent, ChatOptions, ChatCompletion, CloudTrainConfig, CloudTrainError } from "./types";

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
     */
    async chat(options: Omit<ChatOptions, "stream">): Promise<ChatCompletion> {
        const { signal, cleanup } = this.createTimeoutController(options.signal, options.timeoutMs ?? this.defaultTimeoutMs);
        try {
            const response = await this.fetch(`${this.baseUrl}/api/v1/chat/completions`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    messages: options.messages,
                    stream: false,
                    meta: options.meta,
                }),
                signal,
            });

            if (!response.ok) {
                const body = await response.json() as CloudTrainError;
                throw new CloudTrainAPIError(response.status, body.error);
            }

            return await (response.json() as Promise<ChatCompletion>);
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
     * Resolves when the stream completes naturally. Rejects with
     * `CloudTrainAPIError` on HTTP errors or `DOMException("AbortError")` when
     * aborted via signal/timeout. `onError` is also invoked for consumers that
     * prefer to handle errors via callback rather than `.catch()`.
     */
    async chatStream(
        options: Omit<ChatOptions, "stream"> & {
            onChunk: (chunk: string) => void;
            onComplete?: () => void;
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
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    options.onChunk(decoder.decode(value, { stream: true }));
                }
            } finally {
                reader.releaseLock();
            }
            options.onComplete?.();
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
