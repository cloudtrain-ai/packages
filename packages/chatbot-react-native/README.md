# CloudTrain Chatbot for React Native

A customizable chatbot component for React Native. Works with any RN project (Expo or bare).

## Installation

```sh
npm install @cloudtrain/chatbot-react-native @cloudtrain/sdk react-native-svg react-native-markdown-display react-native-safe-area-context
```

Peer dependencies: `react`, `react-native`, `react-native-svg`, `react-native-markdown-display`, `react-native-safe-area-context`.

### Optional: conversation persistence

To persist conversations across app restarts, also install:

```sh
npm install @react-native-async-storage/async-storage
```

Without it, the chatbot still works — conversations just don't survive a restart.

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
| `revealDelayMs`   | number   | ❌       | Ms between each character in the streaming reveal animation. `0` (default) shows characters as they arrive; positive values (e.g. `20`) produce a typewriter effect. |
| `defaultOpen`     | boolean  | ❌       | If `true`, the chat panel opens automatically on mount. Defaults to `false`. |
| `onError`         | `(error: unknown) => void` | ❌ | Called when a chat request fails (excludes user-initiated aborts). |
| `onChatOpened`    | `() => void` | ❌ | Called when the chat panel opens. |
| `onChatClosed`    | `() => void` | ❌ | Called when the chat panel closes. |
| `onMessageSent`   | `(event: { text: string }) => void` | ❌ | Called when the user submits a message. |
| `onMessageReceived` | `(event: { text: string }) => void` | ❌ | Called when a complete AI reply finishes streaming. |
| `onConversationReset` | `() => void` | ❌ | Called when the user confirms "New chat". |
| `persistConversation` | boolean | ❌ | Persist the conversation in AsyncStorage so it survives app restarts. Defaults to `true`. Requires `@react-native-async-storage/async-storage` to be installed — silently no-ops without it. |
| `persistTtlHours` | number | ❌ | How long (in hours) to keep a persisted conversation before discarding on next load. Defaults to `168` (7 days). Pass `0` for indefinite. |
| `persistStorageKey` | string | ❌ | Override the AsyncStorage key. Defaults to `cloudtrain-chat`. Set distinct keys if running multiple chatbots. |
| `requirePreChat`  | boolean | ❌ | Gate the conversation behind a pre-chat lead-capture form. No-op unless `preChatFields` is set. Defaults to `false`. |
| `preChatFields`   | `PreChatField[]` | ❌ | Form fields. Each: `{name, label, type?, required?, placeholder?}`. Captured values are merged into `meta` automatically. |
| `onLeadCaptured`  | `(lead: Record<string, string>) => void` | ❌ | Called when the user submits the pre-chat form. Receives the captured values. |

### Pre-Chat Lead Capture

```tsx
<CloudtrainChatbot
  apiKey="..."
  requirePreChat
  preChatFields={[
    { name: 'name', label: 'Your name', required: true },
    { name: 'email', label: 'Your email', type: 'email-address', required: true },
    { name: 'company', label: 'Company', placeholder: 'Optional' },
  ]}
  onLeadCaptured={(lead) => analytics.identify(lead.email, lead)}
/>
```

The form persists alongside the conversation (when AsyncStorage is available) so returning users don't re-fill. Resetting the conversation clears the captured lead.

### Persistence & Privacy

Conversations are persisted to AsyncStorage by default so the user can come back to an in-progress chat. **Requires** the optional peer dep:

```sh
npm install @react-native-async-storage/async-storage
```

If the dep isn't installed, persistence silently no-ops (no crash) and behaves as if `persistConversation={false}` was set.

As the app owner you are the data controller — disclose persistence in your privacy policy and gate it via your existing consent flow when required:

```tsx
<CloudtrainChatbot
  apiKey="..."
  persistConversation={userHasConsented}
/>
```

On shared devices, the next user opening the app will see the prior conversation until it's reset or expires (`persistTtlHours`, default 7 days).

### Event callback example

```tsx
<CloudtrainChatbot
  apiKey="YOUR_API_KEY"
  onChatOpened={() => analytics.track('Chatbot opened')}
  onMessageSent={({ text }) => analytics.track('Message sent', { length: text.length })}
  onMessageReceived={({ text }) => analytics.track('Reply received')}
  onConversationReset={() => analytics.track('Conversation reset')}
/>
```

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
