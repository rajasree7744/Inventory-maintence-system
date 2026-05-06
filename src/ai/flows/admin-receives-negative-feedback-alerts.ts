'use server';
/**
 * @fileOverview This file contains a Genkit flow for analyzing customer feedback
 * to identify potentially negative feedback based on rating and keywords.
 *
 * - analyzeFeedback - A function that handles the feedback analysis process.
 * - AnalyzeFeedbackInput - The input type for the analyzeFeedback function.
 * - AnalyzeFeedbackOutput - The return type for the analyzeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFeedbackInputSchema = z.object({
  feedbackId: z.string().describe('The ID of the feedback entry.'),
  rating: z.number().int().min(1).max(5).describe('The star rating given by the customer (1-5).'),
  comment: z.string().describe('The customer\'s comment.'),
});
export type AnalyzeFeedbackInput = z.infer<typeof AnalyzeFeedbackInputSchema>;

const AnalyzeFeedbackOutputSchema = z.object({
  isNegative: z.boolean().describe('True if the feedback is considered negative, false otherwise.'),
  reason: z.string().describe('Explanation of why the feedback is considered negative (e.g., "Low rating" or "Contains negative keywords").'),
});
export type AnalyzeFeedbackOutput = z.infer<typeof AnalyzeFeedbackOutputSchema>;

export async function analyzeFeedback(input: AnalyzeFeedbackInput): Promise<AnalyzeFeedbackOutput> {
  return analyzeFeedbackFlow(input);
}

const analyzeFeedbackPrompt = ai.definePrompt({
  name: 'analyzeFeedbackPrompt',
  input: {schema: AnalyzeFeedbackInputSchema},
  output: {schema: AnalyzeFeedbackOutputSchema},
  prompt: `You are an assistant that analyzes customer feedback for negativity.

Determine if the following feedback is negative based on these rules:
1. The rating is 2 stars or less (rating <= 2).
2. The comment contains any of these keywords (case-insensitive): 'defect', 'damaged', 'broken'.

Provide a concise reason for your determination.

Feedback Rating: {{{rating}}}
Feedback Comment: "{{{comment}}}"`,
});

const analyzeFeedbackFlow = ai.defineFlow(
  {
    name: 'analyzeFeedbackFlow',
    inputSchema: AnalyzeFeedbackInputSchema,
    outputSchema: AnalyzeFeedbackOutputSchema,
  },
  async (input) => {
    const {output} = await analyzeFeedbackPrompt(input);
    return output!;
  }
);
