export type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type ChatOptions = {
    messages: Message[];
    stream?: boolean;
    meta?: Record<string, unknown>;
    signal?: AbortSignal;
    timeoutMs?: number;
};

export type ChatCompletion = {
    id: string;
    object: "chat.completion";
    choices: {
        index: number;
        message: Message;
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
};

export type Agent = {
    name: string;
    logo: string | null;
};
