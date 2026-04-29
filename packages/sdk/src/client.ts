import type { ChatOptions, ChatCompletion, CloudTrainConfig, CloudTrainError } from "./types";

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

    constructor(config: CloudTrainConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? "https://cloudtrain.ai").replace(/\/$/, "");
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
        const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({
                messages: options.messages,
                stream: false,
                meta: options.meta,
            }),
        });

        if (!response.ok) {
            const body = await response.json() as CloudTrainError;
            throw new CloudTrainAPIError(response.status, body.error);
        }

        return response.json() as Promise<ChatCompletion>;
    }

    /**
     * Send a chat completion request and stream the response text.
     * Yields text chunks as they arrive.
     */
    async *chatStream(options: Omit<ChatOptions, "stream">): AsyncGenerator<string, void, unknown> {
        const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({
                messages: options.messages,
                stream: true,
                meta: options.meta,
            }),
        });

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
    }
}
