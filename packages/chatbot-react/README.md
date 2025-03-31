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
      <CloudtrainChatbot apiKey="YOUR_API_KEY_HERE" />
    </div>
  );
}

export default App;
```

Replace `YOUR_API_KEY_HERE` with the API key generated at [CloudTrain AI](https://cloudtrain.ai/).

---

### 3️⃣ **Adding Chat Suggestions**
You can pass chat suggestions as a prop:

```jsx
<CloudtrainChatbot 
  apiKey="YOUR_API_KEY_HERE"
  chatSuggestions={["How can I help you?", "Tell me more about your issue.", "What can I assist you with today?"]} 
/>
```

---

### 4️⃣ **Setting Theme**
You can specify a theme using the `theme` prop. Available options are `light`, `dark`, or `system`:

```jsx
<CloudtrainChatbot 
  apiKey="YOUR_API_KEY_HERE"
  theme="dark"
/>
```

If `theme` is set to `system`, it will adapt to the user's system preference.

---

## 📌 API Reference

### 🔹 Props
| Prop             | Type     | Required | Description                                    |
|-----------------|----------|----------|------------------------------------------------|
| `apiKey`        | String   | ✅ Yes   | The API key generated on [CloudTrain AI](https://cloudtrain.ai/). |
| `chatSuggestions` | Array    | ❌ No   | An array of strings used as chatbot prompts. |
| `theme`         | "light" \| "dark" \| "system" \| undefined | ❌ No | Sets the chatbot theme. Defaults to system preference if undefined. |

---

## 🔑 How to Generate API Key
1. Go to [CloudTrain AI](https://cloudtrain.ai/).
2. Create an AI model for your chatbot.
3. Generate an API key for the model.
4. Use the API key in the `apiKey` prop of the `CloudtrainChatbot` component.

---

## 📜 License
This project is licensed under the **MIT License**.

---

💡 Need help? Contact support at [CloudTrain AI](https://cloudtrain.ai/). 🚀