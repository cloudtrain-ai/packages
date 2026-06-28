# cloudtrain-chatbot



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute              | Description                                                                                                                                                                                                         | Type                              | Default                       |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------- |
| `apiKey` _(required)_ | `api-key`              |                                                                                                                                                                                                                     | `string`                          | `undefined`                   |
| `avatarUrl`           | `avatar-url`           |                                                                                                                                                                                                                     | `string`                          | `undefined`                   |
| `baseUrl`             | `base-url`             |                                                                                                                                                                                                                     | `string`                          | `'https://cloudtrain.ai'`     |
| `botName`             | `bot-name`             |                                                                                                                                                                                                                     | `string`                          | `undefined`                   |
| `chatSuggestions`     | --                     |                                                                                                                                                                                                                     | `string[]`                        | `[]`                          |
| `defaultOpen`         | `default-open`         | If true, the chat panel opens automatically when the chatbot mounts. Useful for demos, onboarding flows, or pages where engagement is desired.                                                                      | `boolean`                         | `false`                       |
| `hideBranding`        | `hide-branding`        |                                                                                                                                                                                                                     | `boolean`                         | `false`                       |
| `meta`                | --                     |                                                                                                                                                                                                                     | `Object`                          | `{}`                          |
| `persistConversation` | `persist-conversation` | Persist the conversation in localStorage so it survives page reloads and navigations. Set to `false` to disable persistence entirely.                                                                               | `boolean`                         | `true`                        |
| `persistStorageKey`   | `persist-storage-key`  | Override the localStorage key used to persist the conversation. Defaults to `cloudtrain-chat:<apiKey-suffix>` for per-agent isolation.                                                                              | `string`                          | `undefined`                   |
| `persistTtlHours`     | `persist-ttl-hours`    | How long (in hours) to keep a persisted conversation before discarding on next load. Defaults to 7 days. Pass `0` to keep indefinitely.                                                                             | `number`                          | `24 * 7`                      |
| `position`            | `position`             |                                                                                                                                                                                                                     | `"bottom-left" \| "bottom-right"` | `'bottom-right'`              |
| `preChatFields`       | --                     | Field configuration for the pre-chat lead-capture form. Each field renders as an input; required fields must be filled to submit.  Example: [{ name: 'email', label: 'Your email', type: 'email', required: true }] | `PreChatField[]`                  | `[]`                          |
| `requirePreChat`      | `require-pre-chat`     | If true, gate the conversation behind a pre-chat form. Captured values are merged into `meta` so the AI sees the lead's context. Requires `preChatFields` to be non-empty — otherwise this flag is a no-op.         | `boolean`                         | `false`                       |
| `revealDelayMs`       | `reveal-delay-ms`      | Milliseconds between each character reveal in the streaming animation. `0` (default) shows characters as fast as they arrive from the network. A positive value (e.g. `20`) produces a typewriter effect.           | `number`                          | `0`                           |
| `theme`               | `theme`                |                                                                                                                                                                                                                     | `"dark" \| "light" \| "system"`   | `'system'`                    |
| `welcomeMessage`      | `welcome-message`      |                                                                                                                                                                                                                     | `string`                          | `'How can I help you today?'` |
| `welcomeSubtitle`     | `welcome-subtitle`     |                                                                                                                                                                                                                     | `string`                          | `undefined`                   |


## Events

| Event               | Description                                                                        | Type                                    |
| ------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| `chatClosed`        | Fired when the chat panel closes.                                                  | `CustomEvent<void>`                     |
| `chatOpened`        | Fired when the chat panel opens.                                                   | `CustomEvent<void>`                     |
| `conversationReset` | Fired when the user resets the conversation.                                       | `CustomEvent<void>`                     |
| `errorOccurred`     | Fired when an error happens during send/stream. Detail: error message.             | `CustomEvent<{ message: string; }>`     |
| `leadCaptured`      | Fired when the pre-chat lead form is submitted. Detail: the captured field values. | `CustomEvent<{ [x: string]: string; }>` |
| `messageReceived`   | Fired when a complete AI reply has finished streaming. Detail: the final text.     | `CustomEvent<{ text: string; }>`        |
| `messageSent`       | Fired when the user submits a message. Detail: the message text.                   | `CustomEvent<{ text: string; }>`        |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
