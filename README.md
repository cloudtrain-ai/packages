# CloudTrain Packages

Official client packages for [CloudTrain](https://cloudtrain.ai) — build AI agents trained on your data and embed them anywhere.

## Packages

| Package | Description |
|---------|-------------|
| [`@cloudtrain/sdk`](./packages/sdk) | Lightweight API client (`chat`, `chatStream`, `getAgent`, `revealStream`). Works in browser, Node, and React Native. |
| [`@cloudtrain/chatbot`](./packages/chatbot) | Drop-in web component (`<cloudtrain-chatbot>`) for any HTML/JS/Vue/Svelte/etc. site. |
| [`@cloudtrain/chatbot-react`](./packages/chatbot-react) | React bindings for the web component. |
| [`@cloudtrain/chatbot-react-native`](./packages/chatbot-react-native) | Native chatbot UI for React Native apps. |

## Quick start

Pick the package that matches your stack and follow its README. The shortest path for each:

### Web (HTML)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@cloudtrain/chatbot@latest/dist/cloudtrain-chatbot/cloudtrain-chatbot.esm.js"></script>
<cloudtrain-chatbot api-key="YOUR_API_KEY"></cloudtrain-chatbot>
```

### React (web)

```bash
npm install @cloudtrain/chatbot-react
```
```tsx
import { CloudtrainChatbot } from "@cloudtrain/chatbot-react";
<CloudtrainChatbot api-key="YOUR_API_KEY" />
```

### React Native

```bash
npm install @cloudtrain/chatbot-react-native @cloudtrain/sdk react-native-svg react-native-markdown-display
```
```tsx
import { CloudtrainChatbot } from "@cloudtrain/chatbot-react-native";
<CloudtrainChatbot apiKey="YOUR_API_KEY" />
```

### Direct API (SDK only)

```bash
npm install @cloudtrain/sdk
```
```ts
import { CloudTrain } from "@cloudtrain/sdk";
const client = new CloudTrain({ apiKey: "YOUR_API_KEY" });
for await (const chunk of client.chatStream({ messages: [{ role: "user", content: "Hi" }] })) {
  process.stdout.write(chunk);
}
```

## Features

- Streaming chat with controlled per-character reveal
- Theming via CSS variables (web) or theme tokens (React Native)
- Agent metadata (name, logo) fetched from your CloudTrain account
- Abort signals, configurable timeouts
- Conversation reset, error + retry UI
- Empty-state suggestions, custom welcome copy
- Position, branding, and behavior controlled via props

## Repository

This is a monorepo managed with [Lerna](https://lerna.js.org/) + Bun workspaces. Each package under `packages/` is published independently to npm.

```
packages/
├── sdk/                   # @cloudtrain/sdk
├── chatbot/               # @cloudtrain/chatbot
├── chatbot-react/         # @cloudtrain/chatbot-react
├── chatbot-react-native/  # @cloudtrain/chatbot-react-native
└── chatbot-react-demo-app # internal demo, not published
```

## Releases

Releases are triggered by publishing a GitHub Release with a `vX.Y.Z` tag. The `publish.yml` workflow sets all package versions to the tag, pins internal cross-package deps, builds, and publishes to npm with provenance.

## License

MIT. Need help? Reach out at [cloudtrain.ai](https://cloudtrain.ai/).
