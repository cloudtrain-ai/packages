# cloudtrain-chatbot



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute          | Description                                                                                                                                                                                               | Type                              | Default                       |
| --------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------- |
| `apiKey` _(required)_ | `api-key`          |                                                                                                                                                                                                           | `string`                          | `undefined`                   |
| `avatarUrl`           | `avatar-url`       |                                                                                                                                                                                                           | `string`                          | `undefined`                   |
| `baseUrl`             | `base-url`         |                                                                                                                                                                                                           | `string`                          | `'https://cloudtrain.ai'`     |
| `botName`             | `bot-name`         |                                                                                                                                                                                                           | `string`                          | `undefined`                   |
| `chatSuggestions`     | --                 |                                                                                                                                                                                                           | `string[]`                        | `[]`                          |
| `defaultOpen`         | `default-open`     | If true, the chat panel opens automatically when the chatbot mounts. Useful for demos, onboarding flows, or pages where engagement is desired.                                                            | `boolean`                         | `false`                       |
| `hideBranding`        | `hide-branding`    |                                                                                                                                                                                                           | `boolean`                         | `false`                       |
| `meta`                | --                 |                                                                                                                                                                                                           | `Object`                          | `{}`                          |
| `position`            | `position`         |                                                                                                                                                                                                           | `"bottom-left" \| "bottom-right"` | `'bottom-right'`              |
| `revealDelayMs`       | `reveal-delay-ms`  | Milliseconds between each character reveal in the streaming animation. `0` (default) shows characters as fast as they arrive from the network. A positive value (e.g. `20`) produces a typewriter effect. | `number`                          | `0`                           |
| `theme`               | `theme`            |                                                                                                                                                                                                           | `"dark" \| "light" \| "system"`   | `'system'`                    |
| `welcomeMessage`      | `welcome-message`  |                                                                                                                                                                                                           | `string`                          | `'How can I help you today?'` |
| `welcomeSubtitle`     | `welcome-subtitle` |                                                                                                                                                                                                           | `string`                          | `undefined`                   |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
