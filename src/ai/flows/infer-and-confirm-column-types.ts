'use server';

/**
 * @fileOverview Infers the data type of each column in a CSV file and allows the user to confirm or override the detected types.
 *
 * - inferAndConfirmColumnTypes - A function that handles the data type inference and confirmation process.
 * - InferAndConfirmColumnTypesInput - The input type for the inferAndConfirmColumnTypes function.
 * - InferAndConfirmColumnTypesOutput - The return type for the inferAndConfirmColumnTypes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ColumnTypeSchema = z.enum(['NUMERIC', 'TEXT', 'DATE', 'CATEGORICAL']);

const InferAndConfirmColumnTypesInputSchema = z.object({
  columnName: z.string().describe('The name of the column to infer the type for.'),
  sampleValues: z.array(z.string()).describe('Sample values from the column.'),
  fileSize: z.number().describe('The size of the CSV file in bytes.'),
  sparsityScore: z.number().describe('The sparsity score of the CSV file'),
});
export type InferAndConfirmColumnTypesInput = z.infer<typeof InferAndConfirmColumnTypesInputSchema>;

const InferAndConfirmColumnTypesOutputSchema = z.object({
  columnName: z.string().describe('The name of the column.'),
  detectedType: ColumnTypeSchema.describe('The detected data type of the column.'),
  confidence: z.number().describe('The confidence score (0-100) of the detected type.'),
});
export type InferAndConfirmColumnTypesOutput = z.infer<typeof InferAndConfirmColumnTypesOutputSchema>;

export async function inferAndConfirmColumnTypes(
  input: InferAndConfirmColumnTypesInput
): Promise<InferAndConfirmColumnTypesOutput> {
  return inferAndConfirmColumnTypesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'inferAndConfirmColumnTypesPrompt',
  input: {schema: InferAndConfirmColumnTypesInputSchema},
  output: {schema: InferAndConfirmColumnTypesOutputSchema},
  prompt: `You are an expert data analyst specializing in data type inference.

You are provided with the name of a column in a CSV file, sample values from that column, the file size, and the sparsity score.

Your task is to infer the most likely data type of the column and provide a confidence score (0-100%).

Possible data types are: NUMERIC, TEXT, DATE, CATEGORICAL.

Consider the following when inferring the data type:

- NUMERIC: Matches /^-?\\d+\.?\\d*$/ (includes decimals)
- TEXT: Pure strings, non-numeric
- DATE: Matches common date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
- CATEGORICAL: Text with limited unique values (<20)

For each type, calculate a confidence score (0-100%):

- If 90%+ of samples match pattern -> HIGH confidence
- If 70-90% match -> MEDIUM confidence
- If <70% match -> LOW confidence

Column Name: {{{columnName}}}
Sample Values: {{{sampleValues}}}
File Size: {{{fileSize}}} bytes
Sparsity Score: {{{sparsityScore}}}%

Response format:
{
  "columnName": "<column_name>",
  "detectedType": "<NUMERIC|TEXT|DATE|CATEGORICAL>",
  "confidence": <0-100>
}
`,
});

const inferAndConfirmColumnTypesFlow = ai.defineFlow(
  {
    name: 'inferAndConfirmColumnTypesFlow',
    inputSchema: InferAndConfirmColumnTypesInputSchema,
    outputSchema: InferAndConfirmColumnTypesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
