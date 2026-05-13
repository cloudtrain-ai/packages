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

    constructor(config: CloudTrainConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? "https://cloudtrain.ai").replace(/\/$/, "");
        this.defaultTimeoutMs = config.timeoutMs ?? 60_000;
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
            const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
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
     * Send a chat completion request and stream the response text.
     * Yields text chunks as they arrive.
     */
    async *chatStream(options: Omit<ChatOptions, "stream">): AsyncGenerator<string, void, unknown> {
        const { signal, cleanup, clearTimeoutOnly } = this.createTimeoutController(options.signal, options.timeoutMs ?? this.defaultTimeoutMs);
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
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
                    yield decoder.decode(value, { stream: true });
                }
            } finally {
                reader.releaseLock();
            }
        } finally {
            cleanup();
        }
    }

    /**
     * Fetch metadata for the agent associated with the current API key.
     */
    async getAgent(): Promise<Agent> {
        const response = await fetch(`${this.baseUrl}/api/v1/agent`, {
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
