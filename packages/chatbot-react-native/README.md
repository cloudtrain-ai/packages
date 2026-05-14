# CloudTrain Chatbot for React Native

A customizable chatbot component for React Native. Works with any RN project (Expo or bare).

## Installation

```sh
npm install @cloudtrain/chatbot-react-native @cloudtrain/sdk react-native-svg react-native-markdown-display react-native-safe-area-context
```

Peer dependencies: `react`, `react-native`, `react-native-svg`, `react-native-markdown-display`, `react-native-safe-area-context`.

### Streaming

For **live character-by-character streaming**, the chatbot uses [`expo/fetch`](https://docs.expo.dev/versions/latest/sdk/expo/#fetch) when available (Expo SDK 51+). It's picked up automatically — no code changes required.

For **bare React Native** (no Expo) the chatbot falls back to the non-streaming `chat()` endpoint and reveals the full response with the same char-paced animation. UX is nearly identical, but the user waits for the full response before the reveal begins rather than seeing live tokens.

## Usage

```tsx
import { CloudtrainChatbot } from '@cloudtrain/chatbot-react-native';

export default function App() {
  return (
    <>
      <YourApp />
      <CloudtrainChatbot apiKey="YOUR_API_KEY" />
    </>
  );
}
```

The component renders an absolutely-positioned FAB that opens a full-screen modal chat. Place it once at the root of your app.

## Props

| Prop              | Type     | Required | Description                                          |
|-------------------|----------|----------|------------------------------------------------------|
| `apiKey`          | string   | ✅       | API key from [CloudTrain](https://cloudtrain.ai/). |
| `baseUrl`         | string   | ❌       | Custom API base URL. Defaults to `https://cloudtrain.ai`. |
| `chatSuggestions` | string[] | ❌       | Prompts shown in the empty state. |
| `theme`           | `"light" \| "dark" \| "system"` | ❌ | Defaults to system. |
| `themeOverride`   | `Partial<Theme>` | ❌ | Override individual color tokens. |
| `meta`            | object   | ❌       | Custom metadata forwarded to the AI model. |
| `hideBranding`    | boolean  | ❌       | Hides the "Powered by CloudTrain" footer. |
| `botName`         | string   | ❌       | Overrides the agent name in the header. Falls back to the API, then `"AI Assistant"`. |
| `avatarUrl`       | string   | ❌       | Overrides the agent avatar. Falls back to the API's `logo`. |
| `welcomeMessage`  | string   | ❌       | Heading shown in the empty state. |
| `welcomeSubtitle` | string   | ❌       | Subline shown under the heading. |
| `position`        | `"bottom-right" \| "bottom-left"` | ❌ | FAB anchor corner. Defaults to `bottom-right`. |

## Theming

Pass a `themeOverride` object with any subset of the theme tokens:

```tsx
<CloudtrainChatbot
  apiKey="..."
  themeOverride={{
    primary: '#FF6B35',
    primaryForeground: '#fff',
    accent: '#FFE5DA',
  }}
/>
```

Available tokens: `background`, `foreground`, `border`, `primary`, `primaryForeground`, `mutedForeground`, `accent`, `messageIcon`, `destructive`.

## License

MIT
