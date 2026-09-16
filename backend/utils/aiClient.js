// Uses Groq's free API (OpenAI-compatible) — https://console.groq.com
// Get a free API key there and put it in backend/.env as GROQ_API_KEY

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

const callGroq = async (messages, { temperature = 0.4, max_tokens = 300 } = {}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from .env");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
};

// Classifies a ticket's priority from its subject line.
// Falls back to "medium" if the AI call fails, so ticket creation never breaks.
export const detectPriority = async (subject) => {
  try {
    const reply = await callGroq(
      [
        {
          role: "system",
          content:
            "You classify customer support ticket urgency. Reply with exactly one word: low, medium, high, or urgent. No punctuation, no explanation.",
        },
        { role: "user", content: subject },
      ],
      { temperature: 0, max_tokens: 5 }
    );

    const clean = reply.toLowerCase().replace(/[^a-z]/g, "");
    const valid = ["low", "medium", "high", "urgent"];
    return valid.includes(clean) ? clean : "medium";
  } catch (error) {
    console.error("Priority detection failed:", error.message);
    return "medium";
  }
};

// Generates a suggested reply for an agent, given the ticket + conversation so far.
export const suggestAgentReply = async (subject, conversation) => {
  const history = conversation
    .map((m) => `${m.sender === "agent" ? "Agent" : "Customer"}: ${m.text}`)
    .join("\n");

  return callGroq([
    {
      role: "system",
      content:
        "You are a helpful, professional customer support agent. Write a short, friendly, specific reply to the customer's latest message. Do not repeat the conversation, just write the reply itself. Keep it under 80 words.",
    },
    {
      role: "user",
      content: `Ticket subject: ${subject}\n\nConversation so far:\n${history}\n\nWrite the agent's next reply:`,
    },
  ]);
};

// Powers the customer-facing "Ask AI" instant assistant.
export const answerAsAIAssistant = async (subject, conversation) => {
  const history = conversation
    .map((m) => `${m.sender === "customer" ? "Customer" : "Support"}: ${m.text}`)
    .join("\n");

  return callGroq([
    {
      role: "system",
      content:
        "You are a friendly AI support assistant for a business's help desk. Answer the customer's question as best you can in a short, clear reply. If it needs a human (billing, account-specific issues, refunds), say a human agent will follow up. Keep it under 60 words.",
    },
    {
      role: "user",
      content: `Ticket subject: ${subject}\n\nConversation so far:\n${history}\n\nWrite the AI assistant's reply:`,
    },
  ]);
};
