# CloudTrain Chatbot for React

The **CloudTrain Chatbot** is a customizable React component that enables seamless chatbot integration into your React application.  
Users must create an AI model on [CloudTrain AI](https://cloudtrain.ai/) and generate an API key to use this component.

---

## 🚀 Features
- AI chatbot React component.
- Fully customizable chatbot suggestions.
- Responsive and lightweight.

---

## 📖 Getting Started

### 1️⃣ **Installation**
Install the CloudTrain Chatbot package using npm:

```sh
npm i @cloudtrain/chatbot-react
```

---

### 2️⃣ **Usage**
Import the `CloudtrainChatbot` component and use it in your React project:

```jsx
import { CloudtrainChatbot } from "@cloudtrain/chatbot-react";

function App() {
  return (
    <div>
      <CloudtrainChatbot api-key="YOUR_API_KEY_HERE" />
    </div>
  );
}

export default App;
```

Replace `YOUR_API_KEY_HERE` with the API key generated at [CloudTrain AI](https://cloudtrain.ai/).

> **Note:** Props use kebab-case (e.g. `api-key`) to match the underlying web component attributes.

---

### 3️⃣ **Adding Chat Suggestions**
You can pass chat suggestions as a prop:

```jsx
<CloudtrainChatbot 
  api-key="YOUR_API_KEY_HERE"
  chat-suggestions={["How can I help you?", "Tell me more about your issue.", "What can I assist you with today?"]} 
/>
```

---

### 4️⃣ **Setting Theme**
You can specify a theme using the `theme` prop. Available options are `light`, `dark`, or `system`:

```jsx
<CloudtrainChatbot 
  api-key="YOUR_API_KEY_HERE"
  theme="dark"
/>
```

If `theme` is set to `system`, it will adapt to the user's system preference.

---

### 5️⃣ **Passing Meta Data**
You can pass a custom `meta` object to the chatbot to provide additional context or metadata to the AI:

```jsx
<CloudtrainChatbot 
  api-key="YOUR_API_KEY_HERE"
  meta={{ name: "John" }}
/>
```

---

### 6️⃣ **Customizing Colors**
You can override the default color variables to customize the chatbot's appearance.

Add CSS rules in your app targeting `:root` or the `cloudtrain-chatbot` tag:

```css
:root {
  --cloudtrain-foreground: 0, 100%, 50%;
}

cloudtrain-chatbot[data-theme="dark"] {
  --cloudtrain-foreground: 120, 100%, 50%;
}
```

#### List of Overridable CSS Variables

- `--cloudtrain-background`
- `--cloudtrain-foreground`
- `--cloudtrain-border`
- `--cloudtrain-primary`
- `--cloudtrain-primary-foreground`
- `--cloudtrain-input`
- `--cloudtrain-muted-foreground`
- `--cloudtrain-ring`
- `--cloudtrain-accent`
- `--cloudtrain-accent-foreground`
- `--cloudtrain-message-icon`

---

## 📌 API Reference

### 🔹 Props
| Prop              | Type     | Required | Description                                    |
|-------------------|----------|----------|------------------------------------------------|
| `api-key`         | String   | ✅ Yes   | The API key generated on [CloudTrain AI](https://cloudtrain.ai/). |
| `base-url`        | String   | ❌ No    | Custom API base URL. Defaults to `https://cloudtrain.ai`. |
| `chat-suggestions`| Array    | ❌ No    | An array of strings used as chatbot prompts. |
| `theme`           | "light" \| "dark" \| "system" | ❌ No | Sets the chatbot theme. Defaults to system preference. |
| `meta`            | Object   | ❌ No    | Custom metadata object passed to the AI model. |
| `hide-branding`   | Boolean  | ❌ No    | Hides the "Powered by CloudTrain" footer. Defaults to `false`. |
| `bot-name`        | String   | ❌ No    | Overrides the agent name shown in the header. Falls back to the value fetched from the agent endpoint, then `"AI Assistant"`. |
| `avatar-url`      | String   | ❌ No    | Overrides the agent avatar image. Falls back to the agent's `logo` from the API, then a default chat icon. |
| `welcome-message` | String   | ❌ No    | Heading shown in the empty state. Defaults to `"How can I help you today?"`. |
| `welcome-subtitle`| String   | ❌ No    | Subline shown under the heading. When unset, automatically adapts based on whether `chat-suggestions` is provided. |
| `position`        | "bottom-right" \| "bottom-left" | ❌ No | Corner of the viewport where the FAB and panel anchor. Defaults to `bottom-right`. |
| `reveal-delay-ms` | Number | ❌ No    | Ms between each character in the streaming reveal animation. `0` (default) shows characters as they arrive; positive values produce a typewriter effect. |
| `default-open`    | Boolean | ❌ No   | If `true`, the chat panel opens automatically on mount. Defaults to `false`. |

### 🔹 Event Callbacks

Subscribe to lifecycle events via React event props (CustomEvent under the hood — `e.detail` carries the payload):

```jsx
<CloudtrainChatbot
  api-key="YOUR_API_KEY_HERE"
  onChatOpened={() => console.log("opened")}
  onChatClosed={() => console.log("closed")}
  onMessageSent={(e) => console.log("sent:", e.detail.text)}
  onMessageReceived={(e) => console.log("received:", e.detail.text)}
  onConversationReset={() => console.log("reset")}
  onErrorOccurred={(e) => console.error("error:", e.detail.message)}
/>
```

| Prop | Detail | Fires when |
|---|---|---|
| `onChatOpened` | — | Chat panel opens |
| `onChatClosed` | — | Chat panel closes |
| `onMessageSent` | `{ text: string }` | User submits a message |
| `onMessageReceived` | `{ text: string }` | A complete AI reply finishes streaming |
| `onConversationReset` | — | User confirms "New chat" |
| `onErrorOccurred` | `{ message: string }` | A chat request fails (excludes user-initiated aborts) |

---

## 🔑 How to Generate API Key
1. Go to [CloudTrain AI](https://cloudtrain.ai/).
2. Create an AI model for your chatbot.
3. Generate an API key for the model.
4. Use the API key in the `api-key` prop of the `CloudtrainChatbot` component.

---

## 📜 License
This project is licensed under the **MIT License**.

---

💡 Need help? Contact support at [CloudTrain AI](https://cloudtrain.ai/). 🚀