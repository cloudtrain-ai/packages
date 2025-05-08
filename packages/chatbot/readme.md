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
| Attribute  | Type   | Required | Description                                     |
|------------|--------|----------|-------------------------------------------------|
| `api-key`  | String | ✅ Yes   | The API key generated on [CloudTrain AI](https://cloudtrain.ai/). |
| `theme`         | "light" \| "dark" \| "system" \| undefined | ❌ No | Sets the chatbot theme. Defaults to system preference if undefined. |

### 🔹 Properties
| Property           | Type       | Description                                   |
|--------------------|------------|-----------------------------------------------|
| `chatSuggestions`  | Array      | An array of strings used as chatbot prompts. |
| `meta`             | Object     | Optional. A custom object sent to the AI model for context. |

---

## 🔑 How to Generate API Key
1. Go to [CloudTrain AI](https://cloudtrain.ai/).
2. Create an AI model for your chatbot.
3. Generate an API key for the model.
4. Use the API key in the `api-key` attribute of the `<cloudtrain-chatbot>` tag.

---

## 📜 License
This project is licensed under the **MIT License**.

---

💡 Need help? Contact support at [CloudTrain AI](https://cloudtrain.ai/). 🚀


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