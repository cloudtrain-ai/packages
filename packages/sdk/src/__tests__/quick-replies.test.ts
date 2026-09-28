import { describe, expect, test } from "bun:test";
import { CloudTrain } from "../client";

function makeFetch(impl: (url: string, init: RequestInit) => Response | Promise<Response>): typeof fetch {
    return ((input: RequestInfo | URL, init?: RequestInit) =>
        Promise.resolve(impl(String(input), init ?? {}))) as unknown as typeof fetch;
}

/** A body that arrives in these exact pieces - frames split mid-way, as a network splits them. */
function pieces(parts: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            for (const part of parts) controller.enqueue(encoder.encode(part));
            controller.close();
        },
    });
}

describe("chatStream() - quick replies", () => {
    test("asks for events, streams the text, then hands over the replies", async () => {
        let body: any = null;
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch((_url, init) => {
                body = JSON.parse(init.body as string);
                return new Response(pieces([
                    'data: {"text":"Sat',
                    'urday: "}\n\ndata: {"text":"11 or 2?"}\n\n',
                    'data: {"quick_replies":["Sat Oct 3, 11:00 AM","Sat Oct 3, 2:00 PM"]}\n\ndata: [DONE]\n\n',
                ]));
            }),
        });
        const chunks: string[] = [];
        let replies: string[] = [];
        let complete = "";
        await client.chatStream({
            messages: [{ role: "user", content: "Saturday?" }],
            conversation_id: "c",
            onChunk: (c) => chunks.push(c),
            onQuickReplies: (r) => { replies = r; },
            onComplete: (r) => { complete = r; },
        });
        expect(body.stream_format).toBe("events");
        expect(chunks).toEqual(["Saturday: ", "11 or 2?"]);
        expect(complete).toBe("Saturday: 11 or 2?");
        expect(replies).toEqual(["Sat Oct 3, 11:00 AM", "Sat Oct 3, 2:00 PM"]);
    });

    test("without onQuickReplies it is the bare text stream it always was", async () => {
        let body: any = null;
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch((_url, init) => {
                body = JSON.parse(init.body as string);
                return new Response(pieces(["Hello ", "there"]));
            }),
        });
        let complete = "";
        await client.chatStream({ messages: [{ role: "user", content: "Hi" }], onChunk: () => {}, onComplete: (r) => { complete = r; } });
        expect(body).not.toHaveProperty("stream_format");
        expect(complete).toBe("Hello there");
    });

    test("no replies, no call", async () => {
        const client = new CloudTrain({
            apiKey: "k",
            fetch: makeFetch(() => new Response(pieces(['data: {"text":"Hi"}\n\ndata: [DONE]\n\n']))),
        });
        let called = false;
        await client.chatStream({ messages: [{ role: "user", content: "Hi" }], conversation_id: "c", onChunk: () => {}, onQuickReplies: () => { called = true; } });
        expect(called).toBe(false);
    });
});
