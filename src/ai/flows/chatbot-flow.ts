'use server';

/**
 * @fileOverview A chatbot that can answer questions about a processed CSV file and general knowledge questions.
 *
 * - chatWithContext - A function that handles the chat interaction.
 * - ChatWithContextInput - The input type for the chatWithContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Message} from 'genkit/generate';

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const ChatContextSchema = z.object({
    fileName: z.string(),
    rowCount: z.number(),
    columnCount: z.number(),
    sparsityScore: z.number(),
    columnNames: z.array(z.string()),
});

const ChatWithContextInputSchema = z.object({
  messages: z.array(ChatMessageSchema).describe('The conversation history, with the most recent message last.'),
  csvContext: ChatContextSchema,
});
export type ChatWithContextInput = z.infer<typeof ChatWithContextInputSchema>;


export async function chatWithContext(input: ChatWithContextInput): Promise<string> {
  const {messages, csvContext} = input;
  
  if (!messages || messages.length === 0) {
    return "I didn't receive any messages to process.";
  }

  const systemPrompt = `You are an expert data science assistant integrated into a data cleaning application called Sci-Clean Studio. Your primary role is to answer questions about the CSV file the user has just uploaded. You have access to the file's metadata. Be helpful, concise, and use a friendly, professional tone. If the user asks a question that is not related to the provided data context, answer it as a general AI assistant.

**PROVIDED DATA CONTEXT:**
- **File Name:** ${csvContext.fileName}
- **Total Rows:** ${csvContext.rowCount.toLocaleString()}
- **Total Columns:** ${csvContext.columnCount.toLocaleString()}
- **Sparsity (Missing Data):** ${csvContext.sparsityScore.toFixed(2)}%
- **Column Names:** ${csvContext.columnNames.join(', ')}

Based on this context, answer the user's latest question.`;
  
  // Genkit 1.x best practice: separate the history from the current user prompt
  const historyMessages = messages.slice(0, -1);
  const lastUserMessage = messages[messages.length - 1].content;

  const history: Message[] = historyMessages.map((m) => ({
    role: m.role as 'user' | 'model',
    content: [{text: m.content}]
  }));

  try {
    const response = await ai.generate({
      system: systemPrompt,
      history: history,
      prompt: lastUserMessage,
    });

    return response.text;
  } catch (error) {
    console.error("Genkit generate error:", error);
    throw new Error("Failed to generate a response. Please ensure your GOOGLE_GENAI_API_KEY is set correctly in your environment.");
  }
}
