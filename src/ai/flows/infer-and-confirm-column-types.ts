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

const ColumnProfileInputSchema = z.object({
  columnName: z.string().describe('The name of the column.'),
  sampleValues: z.array(z.string()).describe('Sample values from the column.'),
});

const InferAndConfirmColumnTypesInputSchema = z.object({
  columns: z.array(ColumnProfileInputSchema),
  fileSize: z.number().describe('The size of the CSV file in bytes.'),
  sparsityScore: z.number().describe('The sparsity score of the CSV file'),
});
export type InferAndConfirmColumnTypesInput = z.infer<typeof InferAndConfirmColumnTypesInputSchema>;

const ColumnAnalysisResultSchema = z.object({
  columnName: z.string().describe('The name of the column.'),
  detectedType: ColumnTypeSchema.describe('The detected data type of the column.'),
  confidence: z.number().describe('The confidence score (0-100) of the detected type.'),
});

const InferAndConfirmColumnTypesOutputSchema = z.object({
  results: z.array(ColumnAnalysisResultSchema),
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

You are provided with a JSON array of column profiles from a CSV file, along with the total file size and sparsity score.

Your task is to analyze EACH column in the array, infer its most likely data type, and provide a confidence score (0-100%).

Possible data types are: NUMERIC, TEXT, DATE, CATEGORICAL.

Consider the following when inferring the data type for each column:
- NUMERIC: Matches /^-?\\d+\.?\\d*$/ (includes decimals)
- TEXT: Pure strings, non-numeric
- DATE: Matches common date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
- CATEGORICAL: Text with limited unique values (<20)

For each type, calculate a confidence score (0-100%):
- If 90%+ of samples match pattern -> HIGH confidence
- If 70-90% match -> MEDIUM confidence
- If <70% match -> LOW confidence

File Size: {{{fileSize}}} bytes
Sparsity Score: {{{sparsityScore}}}%

Column Profiles to analyze:
{{{json columns}}}

Respond with a single JSON object containing a "results" key. The value of "results" must be an array of objects, where each object corresponds to a column you analyzed and has the following structure:
{
  "columnName": "<column_name>",
  "detectedType": "<NUMERIC|TEXT|DATE|CATEGORICAL>",
  "confidence": <0-100>
}
Ensure the output array has one entry for every column in the input.`,
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
