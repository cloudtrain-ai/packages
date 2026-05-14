/**
 * Wraps an async iterable of text chunks and re-yields it one character at a
 * time at a steady pace. Decouples display speed from network jitter — useful
 * for chat UIs that want a smooth "thoughtful" reveal regardless of how chunks
 * actually arrive.
 *
 * Errors from the underlying stream (including AbortError when the source has
 * been signalled) propagate as throws from this generator.
 */
export async function* revealStream(
    stream: AsyncIterable<string>,
    options: { charDelayMs?: number; signal?: AbortSignal } = {},
): AsyncGenerator<string, void, unknown> {
    const delay = options.charDelayMs ?? 20;
    const signal = options.signal;
    let target = "";
    let displayed = "";
    let streamDone = false;
    let streamError: unknown = null;

    const consumer = (async () => {
        try {
            for await (const chunk of stream) {
                target += chunk;
            }
        } catch (err) {
            streamError = err;
        } finally {
            streamDone = true;
        }
    })();

    try {
        while (true) {
            if (signal?.aborted) {
                throw new DOMException("Aborted", "AbortError");
            }
            if (streamError) throw streamError;
            if (displayed.length < target.length) {
                displayed = target.slice(0, displayed.length + 1);
                yield displayed;
            } else if (streamDone) {
                if (streamError) throw streamError;
                return;
            }
            await new Promise<void>(r => setTimeout(r, delay));
        }
    } finally {
        await consumer.catch(() => {});
    }
}
