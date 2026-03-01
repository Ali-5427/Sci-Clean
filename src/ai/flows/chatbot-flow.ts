
'use server';

/**
 * @fileOverview Data Assistant powered by Groq (Llama 3.3).
 */

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function chatWithContext(input: {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
}): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the Sci-Clean Studio Data Assistant. You help researchers clean and understand their CSV data.
          
Keep your answers concise and professional.
          
Current Data Context:
${input.context || "No file uploaded yet."}`,
        },
        ...input.history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: input.message,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    return completion.choices[0]?.message?.content || "I couldn't generate a response.";
  } catch (error: any) {
    console.error("Groq Chat Error:", error);
    return `Sorry, I ran into an error: ${error.message || "Unknown error"}`;
  }
}
