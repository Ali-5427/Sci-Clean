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

**EXPERT-LEVEL HEURISTICS & OVERRIDES:**
You must follow these rules to resolve ambiguity like a senior data analyst.

1.  **Geographic Data is Always Numeric:**
    *   If a column name is 'latitude', 'longitude', 'lat', or 'lon', you **MUST** classify it as **NUMERIC**. Confidence should be HIGH (95%+) even if some sample values are missing or invalid. This data is for mapping and calculation.

2.  **Version Strings are Always Text:**
    *   If sample values look like software versions (e.g., 'v1.2.3', '2.0.1-beta', '5.2'), you **MUST** classify the column as **TEXT**. Do not be confused by the numbers; these are not for calculation.

3.  **Column Name is a Strong Signal:**
    *   When the column name provides a strong clue (e.g., 'reading_value', 'unit_price', 'age'), you should be confident in that type. Prefer **NUMERIC** for these columns even if a few sample values are messy (e.g., contain text, currency symbols, or are missing). The goal is to identify the *intended* type.

**Standard Analysis Process:**

Use the following heuristics to determine the type and confidence score, applying the expert overrides above when necessary.

1.  **Analyze the Column Name for Clues:**
    *   **NUMERIC indicators:** value, amount, cost, price, total, count, age, quantity, latitude, longitude. _id (if purely numeric samples).
    *   **DATE indicators:** date, time, _at, _on, timestamp.
    *   **CATEGORICAL indicators:** type, category, status, gender, country, code. Also is_, has_, or _flag suggest boolean-like categories.
    *   **TEXT indicators:** name, description, notes, comment, address, version, hash, _id (if alphanumeric).

2.  **Analyze the Sample Values for Patterns:**
    *   **NUMERIC:** The values consist primarily of numbers. If the column name is a strong NUMERIC indicator, be confident. A column of only \`1\`s and \`0\`s should be classified as \`NUMERIC\`.
    *   **DATE:** The values resemble common date or time formats (e.g., YYYY-MM-DD, MM/DD/YYYY, Unix timestamps).
    *   **CATEGORICAL:** The number of unique values is very low (e.g., under 20).
    *   **TEXT:** The values are free-form text, long strings, alphanumeric IDs, or software versions.

3.  **Calculate a Confidence Score (0-100%):**
    *   **HIGH (90-100%):** Both the column name and the sample values strongly and unambiguously point to the same type, or an Expert Override rule applies.
    *   **MEDIUM (70-89%):** The sample values suggest a type, but the name is generic, or vice-versa.
    *   **LOW (<70%):** The name and values are ambiguous or conflict.

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
