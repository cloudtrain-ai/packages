export type Message<T = string> = {
    role: "system" | "user" | "assistant";
    content: T;
};

/**
 * OpenAI-compatible response format. Pass `{ type: "json_schema", json_schema: {...} }`
 * to constrain the model to a JSON Schema; for non-streaming calls the SDK will
 * auto-parse the resulting `content` so callers get a typed object rather than
 * a JSON string. Streaming chunks remain strings — buffer them and parse at the
 * end of the stream.
 *
 * Note: `json_object` is intentionally not supported (the API rejects it).
 */
export type ResponseFormat =
    | { type: "text" }
    | {
        type: "json_schema";
        json_schema: {
            name: string;
            schema: Record<string, unknown>;
            strict?: boolean;
        };
    };

export type ChatOptions = {
    messages: Message[];
    stream?: boolean;
    meta?: Record<string, unknown>;
    signal?: AbortSignal;
    timeoutMs?: number;
    response_format?: ResponseFormat;
};

export type ChatCompletion<T = string> = {
    id: string;
    object: "chat.completion";
    choices: {
        index: number;
        message: Message<T>;
        finish_reason: string;
    }[];
};

export type CloudTrainError = {
    error: {
        message: string;
        type: string;
    };
};

export type CloudTrainConfig = {
    apiKey: string;
    baseUrl?: string;
    timeoutMs?: number;
    /**
     * Optional custom fetch implementation. Pass a streaming-capable fetch
     * (e.g. `expo/fetch`) when the platform's global fetch doesn't expose
     * `response.body` as a `ReadableStream` (React Native default).
     */
    fetch?: typeof fetch;
};

export type Agent = {
    name: string;
    logo: string | null;
};
