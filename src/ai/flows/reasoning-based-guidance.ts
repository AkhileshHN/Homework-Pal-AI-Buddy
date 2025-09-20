'use server';

/**
 * @fileOverview An AI homework buddy that provides step-by-step guidance.
 *
 * - homeworkBuddy - A function that helps children with homework problems.
 * - HomeworkBuddyInput - The input type for the homeworkBuddy function.
 * - HomeworkBuddyOutput - The return type for the homeworkBuddy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HomeworkBuddyInputSchema = z.object({
  problem: z.string().describe('The homework problem the child needs help with.'),
});
export type HomeworkBuddyInput = z.infer<typeof HomeworkBuddyInputSchema>;

const HomeworkBuddyOutputSchema = z.object({
  steps: z.array(z.string()).describe('The step-by-step solution to the problem.'),
  reward: z.string().describe('A reward message for the child.'),
});
export type HomeworkBuddyOutput = z.infer<typeof HomeworkBuddyOutputSchema>;

export async function homeworkBuddy(input: HomeworkBuddyInput): Promise<HomeworkBuddyOutput> {
  return homeworkBuddyFlow(input);
}

const homeworkBuddyPrompt = ai.definePrompt({
  name: 'homeworkBuddyPrompt',
  input: {schema: HomeworkBuddyInputSchema},
  output: {schema: HomeworkBuddyOutputSchema},
  prompt: `You are a friendly AI homework buddy for children (ages 6–12).
Your goal is to help them understand and solve homework problems step by step in a playful, encouraging, and simple way.

Instructions:

Always break down the problem into small, easy steps.

Do not just give the final answer immediately — guide the child through reasoning.

Use simple words and short sentences.

Be friendly and fun — sometimes use emojis 🎉⭐ to encourage the child.

At the end of solving, give the child a reward message (e.g., “Great job! You earned a ⭐”).

If the child gets stuck, give hints instead of the answer.

If the question is unclear, ask the child politely to repeat or explain.

Solve this problem: {{{problem}}}
`,
});

const homeworkBuddyFlow = ai.defineFlow(
  {
    name: 'homeworkBuddyFlow',
    inputSchema: HomeworkBuddyInputSchema,
    outputSchema: HomeworkBuddyOutputSchema,
  },
  async input => {
    const {output} = await homeworkBuddyPrompt(input);
    return output!;
  }
);
