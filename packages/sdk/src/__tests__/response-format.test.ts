import { describe, expect, test } from "bun:test";
import { CloudTrain } from "../client";

type EmailDraft = {
    subject: string;
    body: string;
};

const schema = {
    type: "object",
    properties: {
        subject: { type: "string" },
        body: { type: "string" },
    },
    required: ["subject", "body"],
} as const;

function makeFetch(impl: (url: string, init: RequestInit) => Response | Promise<Response>): typeof fetch {
    return ((input: RequestInfo | URL, init?: RequestInit) =>
        Promise.resolve(impl(String(input), init ?? {}))) as unknown as typeof fetch;
}

function sseStream(frames: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            for (const frame of frames) controller.enqueue(encoder.encode(frame));
            controller.close();
        },
    });
}

describe("chat() — non-streaming", () => {
    test("forwards response_format in request body", async () => {
        let capturedBody: any = null;
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch((_url, init) => {
                capturedBody = JSON.parse(init.body as string);
                return new Response(JSON.stringify({
                    id: "1",
                    object: "chat.completion",
                    choices: [{ index: 0, message: { role: "assistant", content: '{"subject":"Hi","body":"Body"}' }, finish_reason: "stop" }],
                }), { status: 200 });
            }),
        });
        await client.chat<EmailDraft>({
            messages: [{ role: "user", content: "Draft email" }],
            response_format: { type: "json_schema", json_schema: { name: "EmailDraft", schema } },
        });
        expect(capturedBody.response_format).toEqual({ type: "json_schema", json_schema: { name: "EmailDraft", schema } });
        expect(capturedBody.stream).toBe(false);
    });

    test("auto-parses content into typed object when json_schema is set", async () => {
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch(() => new Response(JSON.stringify({
                id: "1",
                object: "chat.completion",
                choices: [{ index: 0, message: { role: "assistant", content: '{"subject":"Launch","body":"Hello"}' }, finish_reason: "stop" }],
            }), { status: 200 })),
        });
        const result = await client.chat<EmailDraft>({
            messages: [{ role: "user", content: "Draft" }],
            response_format: { type: "json_schema", json_schema: { name: "EmailDraft", schema } },
        });
        expect(result.choices[0].message.content).toEqual({ subject: "Launch", body: "Hello" });
    });

    test("leaves content as string when response_format is omitted (backward compat)", async () => {
        let capturedBody: any = null;
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch((_url, init) => {
                capturedBody = JSON.parse(init.body as string);
                return new Response(JSON.stringify({
                    id: "1",
                    object: "chat.completion",
                    choices: [{ index: 0, message: { role: "assistant", content: "Hello world" }, finish_reason: "stop" }],
                }), { status: 200 });
            }),
        });
        const result = await client.chat({ messages: [{ role: "user", content: "Hi" }] });
        expect(capturedBody.response_format).toBeUndefined();
        expect(result.choices[0].message.content).toBe("Hello world");
    });

    test("leaves content as string when response_format.type === 'text'", async () => {
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch(() => new Response(JSON.stringify({
                id: "1",
                object: "chat.completion",
                choices: [{ index: 0, message: { role: "assistant", content: "plain text" }, finish_reason: "stop" }],
            }), { status: 200 })),
        });
        const result = await client.chat({
            messages: [{ role: "user", content: "Hi" }],
            response_format: { type: "text" },
        });
        expect(result.choices[0].message.content).toBe("plain text");
    });
});

describe("chatStream() — buffered streaming", () => {
    test("forwards response_format and parses buffered JSON at onComplete", async () => {
        let capturedBody: any = null;
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch((_url, init) => {
                capturedBody = JSON.parse(init.body as string);
                return new Response(sseStream(['{"subject":"Hi"', ',"body":"Body"}']), { status: 200 });
            }),
        });

        const chunks: string[] = [];
        let final: EmailDraft | null = null;
        await client.chatStream<EmailDraft>({
            messages: [{ role: "user", content: "Draft" }],
            response_format: { type: "json_schema", json_schema: { name: "EmailDraft", schema } },
            onChunk: (c) => chunks.push(c),
            onComplete: (result) => { final = result; },
        });

        expect(capturedBody.stream).toBe(true);
        expect(capturedBody.response_format.type).toBe("json_schema");
        expect(chunks).toEqual(['{"subject":"Hi"', ',"body":"Body"}']);
        expect(final).toEqual({ subject: "Hi", body: "Body" });
    });

    test("onComplete receives joined string when no response_format (backward compat)", async () => {
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch(() => new Response(sseStream(["Hello ", "world"]), { status: 200 })),
        });

        const chunks: string[] = [];
        let final: string | null = null;
        await client.chatStream({
            messages: [{ role: "user", content: "Hi" }],
            onChunk: (c) => chunks.push(c),
            onComplete: (result) => { final = result; },
        });

        expect(chunks).toEqual(["Hello ", "world"]);
        expect(final).toBe("Hello world");
    });
});

describe("chatStreamPartial() — progressive JSON streaming", () => {
    test("sends stream_format: 'partial-json' and required response_format", async () => {
        let capturedBody: any = null;
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch((_url, init) => {
                capturedBody = JSON.parse(init.body as string);
                return new Response(sseStream([
                    'data: {"partial":{"subject":"Hi"}}\n\n',
                    'data: [DONE]\n\n',
                ]), { status: 200 });
            }),
        });

        await client.chatStreamPartial<EmailDraft>({
            messages: [{ role: "user", content: "Draft" }],
            response_format: { type: "json_schema", json_schema: { name: "EmailDraft", schema } },
            onPartial: () => {},
        });

        expect(capturedBody.stream).toBe(true);
        expect(capturedBody.stream_format).toBe("partial-json");
        expect(capturedBody.response_format.type).toBe("json_schema");
    });

    test("emits each partial snapshot and final on [DONE]", async () => {
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch(() => new Response(sseStream([
                'data: {"partial":{"subject":"Don"}}\n\n',
                'data: {"partial":{"subject":"Don\'t miss"}}\n\n',
                'data: {"partial":{"subject":"Don\'t miss","body":"Hello"}}\n\n',
                'data: [DONE]\n\n',
            ]), { status: 200 })),
        });

        const partials: Partial<EmailDraft>[] = [];
        let final: EmailDraft | null = null;
        await client.chatStreamPartial<EmailDraft>({
            messages: [{ role: "user", content: "Draft" }],
            response_format: { type: "json_schema", json_schema: { name: "EmailDraft", schema } },
            onPartial: (p) => partials.push(p),
            onComplete: (f) => { final = f; },
        });

        expect(partials).toEqual([
            { subject: "Don" },
            { subject: "Don't miss" },
            { subject: "Don't miss", body: "Hello" },
        ]);
        expect(final).toEqual({ subject: "Don't miss", body: "Hello" });
    });

    test("handles SSE frames split across chunk boundaries", async () => {
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch(() => new Response(sseStream([
                'data: {"partial":{"sub',
                'ject":"Hi"}}\n\n',
                'data: {"par',
                'tial":{"subject":"Hi","body":"X"}}\n\ndata: [DONE]\n\n',
            ]), { status: 200 })),
        });

        const partials: Partial<EmailDraft>[] = [];
        await client.chatStreamPartial<EmailDraft>({
            messages: [{ role: "user", content: "Draft" }],
            response_format: { type: "json_schema", json_schema: { name: "EmailDraft", schema } },
            onPartial: (p) => partials.push(p),
        });

        expect(partials).toEqual([
            { subject: "Hi" },
            { subject: "Hi", body: "X" },
        ]);
    });
});
