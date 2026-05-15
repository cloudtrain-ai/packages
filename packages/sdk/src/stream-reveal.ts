/**
 * Paces a streamed text reveal one character at a time at a controlled rate.
 *
 * Decouples the displayed text speed from the network's chunk delivery — so
 * a fast stream isn't dumped instantly and a slow stream doesn't stutter.
 *
 * Callback-based (no async generators / `Symbol.asyncIterator`) so it works
 * in restricted runtimes (React Native non-Hermes JSC, etc.).
 *
 * Usage:
 *   const reveal = new StreamReveal({ onUpdate: (text) => setMessage(text) });
 *   await client.chatStream({
 *     messages,
 *     onChunk: (chunk) => reveal.feed(chunk),
 *     onComplete: () => reveal.complete(),
 *     onError: (err) => reveal.abort(err),
 *   });
 *   await reveal.done;
 */
export class StreamReveal {
    private displayed = "";
    private target = "";
    private streamDone = false;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private resolveDone!: () => void;
    private rejectDone!: (err: unknown) => void;
    private readonly onUpdate: (text: string) => void;
    private readonly charDelayMs: number;

    /** Resolves when the reveal animation has drained the entire buffer. */
    readonly done: Promise<void>;

    constructor(options: {
        onUpdate: (text: string) => void;
        charDelayMs?: number;
        signal?: AbortSignal;
    }) {
        this.onUpdate = options.onUpdate;
        this.charDelayMs = options.charDelayMs ?? 20;
        this.done = new Promise<void>((resolve, reject) => {
            this.resolveDone = resolve;
            this.rejectDone = reject;
        });
        if (options.signal) {
            const sig = options.signal;
            if (sig.aborted) {
                this.abort(new DOMException("Aborted", "AbortError"));
            } else {
                sig.addEventListener(
                    "abort",
                    () => this.abort(new DOMException("Aborted", "AbortError")),
                    { once: true },
                );
            }
        }
        this.start();
    }

    /** Append received text to the buffer. */
    feed(chunk: string) {
        this.target += chunk;
    }

    /** Signal that no more chunks will arrive. The reveal continues until the
     *  buffer is fully displayed, then `done` resolves. */
    complete() {
        this.streamDone = true;
    }

    /** Stop the reveal immediately. `done` rejects with `reason` (or resolves
     *  if no reason given). */
    abort(reason?: unknown) {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (reason !== undefined) {
            this.rejectDone(reason);
        } else {
            this.resolveDone();
        }
    }

    /** Currently displayed text. */
    get text(): string {
        return this.displayed;
    }

    private start() {
        this.intervalId = setInterval(() => {
            if (this.displayed.length < this.target.length) {
                this.displayed = this.target.slice(0, this.displayed.length + 1);
                this.onUpdate(this.displayed);
            } else if (this.streamDone) {
                if (this.intervalId !== null) clearInterval(this.intervalId);
                this.intervalId = null;
                this.resolveDone();
            }
        }, this.charDelayMs);
    }
}
