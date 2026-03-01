
'use server';

/**
 * @fileOverview Data Assistant powered by Groq (Llama 3.3).
 * Refined for a friendly, human-centric research partner experience.
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
          content: `You are the Sci-Clean Studio Research Assistant, a friendly, highly skilled, and collaborative partner for researchers. 
          
Your goal is to help users understand, clean, and gain insights from their data. 

Guidelines:
1. **Be Conversational:** Greet users warmly. Use a professional yet approachable tone. 
2. **Contextual Awareness:** Use the provided "Data Context" to answer questions specifically about their file. If no file is uploaded, politely remind them.
3. **Insightful, Not Robotic:** Don't just list numbers. Explain what they mean (e.g., "It looks like about 5% of your 'Income' column is missing, which might affect your averages").
4. **Action-Oriented:** Suggest next steps like "Should we look closer at those outliers in the Revenue column?"
5. **Concise but Complete:** Keep answers helpful without being overly wordy.

Data Context for the current session:
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
    return `I hit a small technical snag: ${error.message || "Unknown error"}. Is your Groq API key configured correctly?`;
  }
}
