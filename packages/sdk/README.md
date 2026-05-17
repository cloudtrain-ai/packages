# CloudTrain SDK

The official **CloudTrain SDK** for JavaScript and TypeScript — interact with AI agents trained on your data through a small, typed client. Works in Node.js, Bun, Deno, browsers, and edge runtimes.

Users must create an AI model on [CloudTrain AI](https://cloudtrain.ai/) and generate an API key to use this SDK.

---

## 🚀 Features
- Typed `chat()` and `chatStream()` methods.
- Streaming responses via async iterators.
- Universal: runs in Node, Bun, browsers, and edge runtimes.
- Zero dependencies.

---

## 📖 Getting Started

### 1️⃣ **Installation**

```sh
npm i @cloudtrain/sdk
```

---

### 2️⃣ **Usage**

```ts
import { CloudTrain } from "@cloudtrain/sdk";

const client = new CloudTrain({
  apiKey: "YOUR_API_KEY_HERE",
});

const completion = await client.chat({
  messages: [
    { role: "user", content: "What is CloudTrain?" },
  ],
});

console.log(completion.choices[0].message.content);
```

Replace `YOUR_API_KEY_HERE` with the API key generated at [CloudTrain AI](https://cloudtrain.ai/).

---

### 3️⃣ **Streaming Responses**

Use `chatStream()` to receive the response as an async iterable of text chunks:

```ts
const stream = client.chatStream({
  messages: [
    { role: "user", content: "Write a short poem about the sea." },
  ],
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

---

### 4️⃣ **Structured Output (JSON Schema)**

Constrain the model to a JSON Schema and get a typed parsed object back — no manual `JSON.parse` needed.

```ts
type MarketingEmail = {
  subject: string;
  preview: string;
  body: string;
  cta_label: string;
};

const completion = await client.chat<MarketingEmail>({
  messages: [{ role: "user", content: "Draft a launch email for our new live chat feature." }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "MarketingEmail",
      schema: {
        type: "object",
        properties: {
          subject:   { type: "string" },
          preview:   { type: "string" },
          body:      { type: "string" },
          cta_label: { type: "string" },
        },
        required: ["subject", "preview", "body", "cta_label"],
      },
      strict: true,
    },
  },
});

const email = completion.choices[0].message.content;
console.log(email.subject);    // typed as string
console.log(email.cta_label);  // typed as string
```

Only `type: "text"` (default) and `type: "json_schema"` are supported. `json_object` is rejected by the API.

#### Streaming JSON — buffer-then-parse

`chatStream()` delivers raw text chunks. For structured output, buffer the chunks and parse once the stream completes:

```ts
let buffer = "";
await client.chatStream({
  messages,
  response_format: { type: "json_schema", json_schema: { name: "Email", schema } },
  onChunk: (chunk) => { buffer += chunk; },
  onComplete: () => {
    const email: MarketingEmail = JSON.parse(buffer);
  },
});
```

#### Streaming JSON — progressive partial objects

For generative-UI patterns (form fields filling in live, lists rendering as they're produced), use `chatStreamPartial<T>()`. The SDK parses CloudTrain's `partial-json` stream and emits a `Partial<T>` snapshot per event, then a final fully-formed `T` on completion:

```ts
await client.chatStreamPartial<MarketingEmail>({
  messages,
  response_format: {
    type: "json_schema",
    json_schema: { name: "MarketingEmail", schema },
  },
  onPartial: (partial) => {
    // Re-render with whatever fields the model has produced so far.
    setDraft(partial);
  },
  onComplete: (final) => {
    // Fully-formed object — all required fields present.
    saveDraft(final);
  },
});
```

Each partial may be missing fields the model hasn't reached yet — the parameter is typed `Partial<T>` to reflect this. `onComplete` receives the last snapshot as `T`.

---

### 5️⃣ **Passing Meta Data**

Pass a custom `meta` object to provide additional context to the AI:

```ts
await client.chat({
  messages: [{ role: "user", content: "Hi" }],
  meta: { name: "John" },
});
```

---

### 6️⃣ **Custom Base URL**

Override the API base URL (useful for self-hosted deployments or testing):

```ts
const client = new CloudTrain({
  apiKey: "YOUR_API_KEY_HERE",
  baseUrl: "https://your-domain.com",
});
```

---

### 7️⃣ **Error Handling**

Failed requests throw a `CloudTrainAPIError` with the response status and error type:

```ts
import { CloudTrain, CloudTrainAPIError } from "@cloudtrain/sdk";

try {
  await client.chat({ messages: [{ role: "user", content: "Hi" }] });
} catch (error) {
  if (error instanceof CloudTrainAPIError) {
    console.error(`[${error.status}] ${error.type}: ${error.message}`);
  } else {
    throw error;
  }
}
```

---

## 📌 API Reference

### 🔹 `new CloudTrain(config)`

| Option     | Type   | Required | Description                                                  |
|------------|--------|----------|--------------------------------------------------------------|
| `apiKey`   | String | ✅ Yes   | The API key generated on [CloudTrain AI](https://cloudtrain.ai/). |
| `baseUrl`  | String | ❌ No    | Custom API base URL. Defaults to `https://cloudtrain.ai`.   |

### 🔹 `client.chat<T>(options)`

Sends a chat completion request and resolves with the full response. When `response_format.type === "json_schema"`, the SDK auto-parses `message.content` into the typed object `T`.

| Option            | Type             | Required | Description                                                                       |
|-------------------|------------------|----------|-----------------------------------------------------------------------------------|
| `messages`        | `Message[]`      | ✅ Yes   | The conversation history.                                                         |
| `meta`            | Object           | ❌ No    | Custom metadata passed to the AI model.                                           |
| `response_format` | `ResponseFormat` | ❌ No    | `{ type: "text" }` (default) or `{ type: "json_schema", json_schema: { name, schema, strict? } }`. |
| `signal`          | `AbortSignal`    | ❌ No    | Abort the request.                                                                |
| `timeoutMs`       | Number           | ❌ No    | Per-request timeout. Defaults to client `timeoutMs`.                              |

Returns: `Promise<ChatCompletion<T>>` (with `T = string` by default).

### 🔹 `client.chatStream(options)`

Same options as `chat()`, plus `onChunk` / `onComplete` / `onError` callbacks for streaming text chunks. `response_format` is forwarded but chunks are delivered as raw strings — buffer them and parse at `onComplete` if using `json_schema`.

### 🔹 `client.chatStreamPartial<T>(options)`

CloudTrain-specific structured streaming. Requires `response_format.type === "json_schema"`. Emits a `Partial<T>` snapshot on each event and a final `T` on completion.

| Option            | Type                                | Required | Description                                                          |
|-------------------|-------------------------------------|----------|----------------------------------------------------------------------|
| `messages`        | `Message[]`                         | ✅ Yes   | The conversation history.                                            |
| `response_format` | `{ type: "json_schema", ... }`      | ✅ Yes   | Required — partial streaming only makes sense for JSON Schema.       |
| `onPartial`       | `(partial: Partial<T>) => void`     | ✅ Yes   | Called with the latest snapshot on every event.                      |
| `onComplete`      | `(final: T) => void`                | ❌ No    | Called once with the final fully-formed object.                      |
| `onError`         | `(err: unknown) => void`            | ❌ No    | Called on stream errors.                                             |
| `meta`            | Object                              | ❌ No    | Custom metadata forwarded to the AI model.                           |
| `signal`          | `AbortSignal`                       | ❌ No    | Abort the stream.                                                    |
| `timeoutMs`       | Number                              | ❌ No    | Time-to-first-byte timeout.                                          |

### 🔹 Types

```ts
type Message<T = string> = {
  role: "system" | "user" | "assistant";
  content: T;
};

type ResponseFormat =
  | { type: "text" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        schema: Record<string, unknown>;
        strict?: boolean;
      };
    };

type ChatCompletion<T = string> = {
  id: string;
  object: "chat.completion";
  choices: {
    index: number;
    message: Message<T>;
    finish_reason: string;
  }[];
};
```

---

## 🔑 How to Generate API Key
1. Go to [CloudTrain AI](https://cloudtrain.ai/).
2. Create an AI model for your chatbot.
3. Generate an API key for the model.
4. Use the API key in the `apiKey` option when constructing the client.

---

## 📜 License
This project is licensed under the **MIT License**.

---

💡 Need help? Contact support at [CloudTrain AI](https://cloudtrain.ai/). 🚀
