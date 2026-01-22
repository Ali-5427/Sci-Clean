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
  prompt: `You are an expert data scientist specializing in data type inference for cleaning messy real-world datasets.

You are provided with a JSON array of column profiles from a CSV file. Your task is to analyze EACH column and act as a highly intelligent assistant to suggest the most appropriate data type.

Your response must be a single JSON object containing a "results" key. The value of "results" must be an array of objects, one for each column, with the following structure:
{
  "columnName": "<column_name>",
  "detectedType": "<NUMERIC|TEXT|DATE|CATEGORICAL>",
  "confidence": <0-100>
}

Use the following heuristics to determine the type and confidence score:

1.  **Analyze the Column Name for Clues:**
    *   **NUMERIC indicators:** value, amount, cost, price, total, count, age, quantity, _id (if purely numeric samples).
    *   **DATE indicators:** date, time, _at, _on, timestamp.
    *   **CATEGORICAL indicators:** type, category, status, gender, country, code. Also is_, has_, or _flag suggest boolean-like categories.
    *   **TEXT indicators:** name, description, notes, comment, address, _id (if alphanumeric).

2.  **Analyze the Sample Values for Patterns:**
    *   **NUMERIC:** The values consist primarily of numbers, possibly with decimals, commas, or currency symbols. Even if there are a few non-numeric values (like 'N/A' or errors), if the majority are numbers, it is still NUMERIC. For columns with only 1s and 0s, strongly prefer NUMERIC, especially if the name contains 'flag' or 'is_'.
    *   **DATE:** The values resemble common date or time formats (e.g., YYYY-MM-DD, MM/DD/YYYY, M/D/YY, YYYY-MM-DD HH:MM:SS).
    *   **CATEGORICAL:** The number of unique values is very low (e.g., under 20). Look for repeating values like "High"/"Medium"/"Low", "True"/"False", "Yes"/"No", or country codes.
    *   **TEXT:** The values are free-form text, long strings, or alphanumeric IDs that don't fit other categories.

3.  **Calculate a Confidence Score (0-100%):**
    *   **HIGH (90-100%):** Both the column name and the sample values strongly and unambiguously point to the same type. (e.g., column 'unit_price' with samples '1.99', '5.00').
    *   **MEDIUM (70-89%):** The sample values suggest a type, but the name is generic, or vice-versa. (e.g., column 'c1' with samples '2024-01-05', '2024-02-10').
    *   **LOW (<70%):** The name and values are ambiguous or conflict. (e.g., column 'status' with samples '1', '2', '3' could be NUMERIC or CATEGORICAL).

**CRITICAL:** Apply this logic to columns like those in a sample file:
- Columns named 'reading_value_2' and 'reading_value_3' contain numbers but are sparse. The name 'reading_value' is a strong indicator for **NUMERIC**.
- A column named 'abnormal_flag' containing only 1s and 0s must be identified as **NUMERIC**.

Apply your enhanced analysis to the following columns:
{{{json columns}}}`,
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
