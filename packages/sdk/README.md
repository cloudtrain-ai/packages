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

### 4️⃣ **Passing Meta Data**

Pass a custom `meta` object to provide additional context to the AI:

```ts
await client.chat({
  messages: [{ role: "user", content: "Hi" }],
  meta: { name: "John" },
});
```

---

### 5️⃣ **Custom Base URL**

Override the API base URL (useful for self-hosted deployments or testing):

```ts
const client = new CloudTrain({
  apiKey: "YOUR_API_KEY_HERE",
  baseUrl: "https://your-domain.com",
});
```

---

### 6️⃣ **Error Handling**

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

### 🔹 `client.chat(options)`

Sends a chat completion request and resolves with the full response.

| Option     | Type        | Required | Description                                  |
|------------|-------------|----------|----------------------------------------------|
| `messages` | `Message[]` | ✅ Yes   | The conversation history.                    |
| `meta`     | Object      | ❌ No    | Custom metadata passed to the AI model.      |

Returns: `Promise<ChatCompletion>`

### 🔹 `client.chatStream(options)`

Same options as `chat()`, but returns an `AsyncGenerator<string>` that yields text chunks as they arrive.

### 🔹 Types

```ts
type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletion = {
  id: string;
  object: "chat.completion";
  choices: {
    index: number;
    message: Message;
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
