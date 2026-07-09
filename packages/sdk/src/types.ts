export type Message<T = string> = {
    role: "system" | "user" | "assistant";
    content: T;
};

/**
 * Constrains the model output format. Pass `{ type: "json_schema", json_schema: {...} }`
 * to constrain the model to a JSON Schema; for non-streaming calls the SDK will
 * auto-parse the resulting `content` so callers get a typed object rather than
 * a JSON string. Streaming chunks remain strings — buffer them and parse at the
 * end of the stream, or use `chatStreamPartial` for progressive partial objects.
 *
 * Schema requirements when `type === "json_schema"`:
 * - Root object must set `additionalProperties: false`.
 * - Every property must be listed in `required` (use a union with `"null"` for
 *   optional fields rather than omitting from `required`).
 *
 * Note: `type: "json_object"` is intentionally not supported.
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
    /**
     * Opaque conversation identifier — when supplied, the server persists
     * the conversation to its own storage and reuses history across requests.
     * Callers pass the same UUID for each turn to keep context. Omit to run
     * in stateless mode (server ignores the conversation, uses only the
     * messages array supplied per-call). CloudTrain-specific extension —
     * not part of OpenAI's chat.completions contract.
     */
    conversation_id?: string;
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

export type AgentCapabilities = {
    /**
     * Media categories the agent's current plan accepts for widget uploads.
     * Values include "text", "image", "audio", "document" (and possibly
     * "video" / "sticker" for channels that produce them, but those aren't
     * pickable via the widget). The widget renders its attachment control
     * only when this list contains at least one uploadable category, and
     * narrows the file picker's `accept` string to what's allowed.
     */
    allowed_media_types: string[];
};

export type Agent = {
    name: string;
    logo: string | null;
    capabilities: AgentCapabilities;
};

/**
 * Coarse buckets the server sorts uploads into — derived from the file's
 * mime type. Matches the shape of channel_messages.type so a widget
 * upload is indistinguishable from a channel-inbound media message once
 * persisted server-side.
 */
export type UploadType = "image" | "audio" | "video" | "document";

export type UploadOptions = {
    /**
     * Conversation this upload belongs to — required. The server persists
     * the file as an inbound message on this conversation so the next
     * chat/completions call sees it in server-authoritative history.
     */
    conversation_id: string;
    signal?: AbortSignal;
    timeoutMs?: number;
};

export type Upload = {
    /**
     * Server-issued channel_messages row id. Pass this to `deleteUpload`
     * to remove the attachment before it's used in a chat turn (e.g.
     * user removes the chip in the widget).
     */
    message_id: number;
    type: UploadType;
    mime_type: string;
    size_bytes: number;
};
