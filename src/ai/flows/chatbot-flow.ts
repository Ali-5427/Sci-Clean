'use server';

/**
 * @fileOverview Data Assistant powered by Groq (Llama 3.3).
 * Refined for a friendly, human-centric research partner experience.
 * Implements "Data on Demand" logic: only talks about data when asked.
 */

import Groq from "groq-sdk";

export async function chatWithContext(input: {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
}): Promise<string> {
  // Initialize inside the function to ensure process.env is ready
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the Sci-Clean Studio Research Assistant, a friendly and collaborative partner.

STRICT BEHAVIOR RULES:
1. **Social First:** If the user greets you (e.g., "hi", "hello", "hey"), respond with a short, warm, and human greeting. 
2. **Data on Demand:** DO NOT mention row counts, column names, missing data percentages, or any specific statistics from the "Data Context" unless the user explicitly asks a question about the file or asks for a summary.
3. **Be Specific in Summaries:** When the user asks for a "summary" or "analysis," switch to a "Data Scientist" mode. You MUST use the exact numbers and percentages provided in the Data Context. Do NOT use vague language like "some" or "a few" when specific counts are available.
4. **Reference, Don't Recite:** Treat the provided Data Context as a reference manual. Only "open" it when needed to answer a specific query.
5. **Tone:** Be professional yet approachable. Avoid acting like a technical manual or a robot.
6. **Supportive:** Instead of suggesting what to do, ask how you can help.

Data Context:
${input.context || "No file has been uploaded yet."}`,
        },
        ...input.history.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: "user",
          content: input.message,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't quite process that. Could you try rephrasing?";
  } catch (error: any) {
    console.error("Groq Chat Error:", error);
    return `I hit a small technical snag: ${error.message || "Unknown error"}. Please check your connection.`;
  }
}