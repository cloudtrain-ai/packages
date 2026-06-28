# CloudTrain Chatbot

The **CloudTrain Chatbot** is a customizable web component that enables seamless chatbot integration into your website or application.  
Users must create an AI model on [CloudTrain AI](https://cloudtrain.ai/) and generate an API key to use this component.

---

## 🚀 Features
- AI chatbot web component.
- Fully customizable chatbot suggestions.
- Pass custom `meta` data to the AI model.
- Responsive and lightweight.

---

## 📖 Getting Started

### 1️⃣ **Include the Component**
Add the component to your HTML by including the following scripts:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@cloudtrain/chatbot@latest/dist/cloudtrain-chatbot/cloudtrain-chatbot.esm.js"></script>
<script nomodule src="https://cdn.jsdelivr.net/npm/@cloudtrain/chatbot@latest/dist/cloudtrain-chatbot/cloudtrain-chatbot.js"></script>
```

---

### 2️⃣ **Usage**
Add the `<cloudtrain-chatbot>` tag to your HTML file and pass your API key as an attribute:

```html
<cloudtrain-chatbot api-key="YOUR_API_KEY_HERE"></cloudtrain-chatbot>
```

Replace `YOUR_API_KEY_HERE` with the API key generated at [CloudTrain AI](https://cloudtrain.ai/).

---

### 3️⃣ **Adding Chat Suggestions**
To add chat suggestions dynamically, use the `chatSuggestions` property:

```html
<script>
  document.querySelector('cloudtrain-chatbot').chatSuggestions = [
    'How can I help you?',
    'Tell me more about your issue.',
    'What can I assist you with today?'
  ];
</script>
```

---

### 4️⃣ **Passing Custom Meta Data**
You can optionally pass a custom `meta` object to the chatbot. This object is forwarded to the AI model and can help personalize or contextualize responses.

```html
<script>
  document.querySelector('cloudtrain-chatbot').meta = {
    name: "John"
  };
</script>
```

Example usage:
```html
<script>
  const chatbot = document.querySelector('cloudtrain-chatbot');
  chatbot.meta = {
    name: "Alice",
    userRole: "admin",
    sessionId: "abc123"
  };
</script>
```

---

## 🌟 Example Integration

Here’s a full example of the chatbot integrated into an HTML page:

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
  <title>CloudTrain Chatbot</title>

  <script type="module" src="https://cdn.jsdelivr.net/npm/@cloudtrain/chatbot@latest/dist/cloudtrain-chatbot/cloudtrain-chatbot.esm.js"></script>
  <script nomodule src="https://cdn.jsdelivr.net/npm/@cloudtrain/chatbot@latest/dist/cloudtrain-chatbot/cloudtrain-chatbot.js"></script>
</head>

<body>
  <!-- Chatbot Component -->
  <cloudtrain-chatbot api-key="2|SwQBlgdQZ2yYOTBxplQVlMIStfWNFJ7UYCTUlGSM896a1f55"></cloudtrain-chatbot>

  <!-- Customize Behavior -->
  <script>
    const chatbot = document.querySelector('cloudtrain-chatbot');

    chatbot.chatSuggestions = [
      'Suggestion 1',
      'Suggestion 2'
    ];

    chatbot.meta = {
      name: "Alice",
      userRole: "admin",
    };
  </script>
</body>

</html>
```

---

## 📌 API Reference

### 🔹 Attributes
| Attribute          | Type   | Required | Description                                     |
|--------------------|--------|----------|-------------------------------------------------|
| `api-key`          | String | ✅ Yes   | The API key generated on [CloudTrain AI](https://cloudtrain.ai/). |
| `base-url`         | String | ❌ No    | Custom API base URL. Defaults to `https://cloudtrain.ai`. |
| `theme`            | "light" \| "dark" \| "system" | ❌ No | Sets the chatbot theme. Defaults to system preference. |
| `hide-branding`    | Boolean | ❌ No   | Hides the "Powered by CloudTrain" footer. Defaults to `false`. |
| `bot-name`         | String | ❌ No    | Overrides the agent name shown in the header. Falls back to the value fetched from the agent endpoint, then `"AI Assistant"`. |
| `avatar-url`       | String | ❌ No    | Overrides the agent avatar image. Falls back to the agent's `logo` from the API, then a default chat icon. |
| `welcome-message`  | String | ❌ No    | Heading shown in the empty state. Defaults to `"How can I help you today?"`. |
| `welcome-subtitle` | String | ❌ No    | Subline shown under the heading. When unset, automatically adapts based on whether `chat-suggestions` is provided. |
| `position`         | "bottom-right" \| "bottom-left" | ❌ No | Corner of the viewport where the FAB and panel anchor. Defaults to `bottom-right`. |
| `reveal-delay-ms`  | Number | ❌ No    | Milliseconds between each character in the streaming reveal animation. `0` (default) shows characters as fast as they arrive. A positive value (e.g. `20`) produces a typewriter effect. |
| `default-open`     | Boolean | ❌ No   | If `true`, the chat panel opens automatically on mount. Defaults to `false`. |
| `persist-conversation` | Boolean | ❌ No | Persist the conversation in `localStorage` so it survives page reloads. Defaults to `true`. Set to `false` to disable. |
| `persist-ttl-hours` | Number | ❌ No   | How long (in hours) to keep a persisted conversation before discarding on next load. Defaults to `168` (7 days). Pass `0` to keep indefinitely. |
| `persist-storage-key` | String | ❌ No  | Override the `localStorage` key. Defaults to `cloudtrain-chat`. Set distinct keys if you run multiple chatbots on the same page. |
| `require-pre-chat` | Boolean | ❌ No  | Gate the conversation behind a pre-chat lead-capture form. No-op unless `preChatFields` is set. Defaults to `false`. |

### 🔹 Properties (set via JavaScript)
| Property           | Type       | Description                                   |
|--------------------|------------|-----------------------------------------------|
| `chatSuggestions`  | Array      | An array of strings used as chatbot prompts. |
| `meta`             | Object     | Optional. A custom object sent to the AI model for context. |
| `preChatFields`    | `PreChatField[]` | Form configuration when `require-pre-chat="true"`. Each field: `{name, label, type?, required?, placeholder?}`. Captured values are merged into `meta` automatically. |

### 🔹 Pre-Chat Lead Capture

Gate the conversation behind a lead-capture form. The submitted values are merged into `meta` so the AI sees the lead's context on subsequent calls.

```html
<cloudtrain-chatbot api-key="..." require-pre-chat="true" id="bot"></cloudtrain-chatbot>
<script>
  document.getElementById('bot').preChatFields = [
    { name: 'name', label: 'Your name', required: true },
    { name: 'email', label: 'Your email', type: 'email', required: true },
    { name: 'company', label: 'Company', placeholder: 'Optional' },
  ];

  document.getElementById('bot').addEventListener('leadCaptured', (e) => {
    console.log('Lead:', e.detail); // { name: '...', email: '...', company: '...' }
  });
</script>
```

The form persists alongside the conversation (subject to `persist-conversation`) so returning visitors don't re-fill. Conversation reset clears the captured lead.

### 🔹 Persistence & Privacy

By default the chatbot persists the user's conversation in `localStorage` so it survives page reloads. This is the same model used by Intercom, Crisp, Drift, and other widget providers.

**Important — disclose this in your privacy policy.** As the website owner you are the data controller; the persisted messages live in your visitor's browser on your origin. On shared devices, the next visitor to open the same browser profile will see the prior conversation until it's reset or expires.

If your jurisdiction or compliance posture requires it:

```html
<!-- Disable entirely -->
<cloudtrain-chatbot api-key="..." persist-conversation="false"></cloudtrain-chatbot>

<!-- Only persist when the visitor has consented -->
<cloudtrain-chatbot api-key="..." id="bot"></cloudtrain-chatbot>
<script>
  document.getElementById('bot').persistConversation = window.userHasConsented === true;
</script>
```

Conversations auto-expire after the configured `persist-ttl-hours` (default 7 days) on the next page load.

---

### 🔹 Events

The component emits standard DOM `CustomEvent`s for lifecycle hooks:

```js
const chatbot = document.querySelector('cloudtrain-chatbot');

chatbot.addEventListener('chatOpened', () => console.log('opened'));
chatbot.addEventListener('messageSent', (e) => console.log('sent:', e.detail.text));
chatbot.addEventListener('messageReceived', (e) => console.log('received:', e.detail.text));
```

| Event | Detail | Fires when |
|---|---|---|
| `chatOpened` | — | Chat panel opens |
| `chatClosed` | — | Chat panel closes |
| `messageSent` | `{ text: string }` | User submits a message |
| `messageReceived` | `{ text: string }` | A complete AI reply finishes streaming |
| `conversationReset` | — | User confirms "New chat" |
| `errorOccurred` | `{ message: string }` | A chat request fails (excludes user-initiated aborts) |
| `leadCaptured` | `Record<string, string>` | The pre-chat lead-capture form is submitted |

---

## 🔑 How to Generate API Key
1. Go to [CloudTrain AI](https://cloudtrain.ai/).
2. Create an AI model for your chatbot.
3. Generate an API key for the model.
4. Use the API key in the `api-key` attribute of the `<cloudtrain-chatbot>` tag.

---

## 🎨 Customizing Colors

You can override the default theme colors used by the chatbot using CSS variables.  
Define your custom values directly on `cloudtrain-chatbot` or at the `:root` level.

### Example: Override Foreground Color

```css
cloudtrain-chatbot, :root {
  --cloudtrain-foreground: 0, 100%, 50%;
}

cloudtrain-chatbot[data-theme='dark'] {
  --cloudtrain-foreground: 120, 100%, 50%;
}
```

### List of Supported CSS Variables

You can override the following variables to customize the chatbot's appearance:

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

## 📜 License
This project is licensed under the **MIT License**.

---

💡 Need help? Contact support at [CloudTrain AI](https://cloudtrain.ai/). 🚀


---