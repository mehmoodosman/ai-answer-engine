import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function getGroqResponse(chatMessagess: ChatMessage[]) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an academic expert, you always cite your sources, and base your responses only on the context text that you have been provided.",
    },
    ...chatMessagess,
  ];
  console.log("messages: ", messages);
  console.log("messages: ", messages);
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
  });

  console.log("response: ", response);

  return response.choices[0].message.content;
}
