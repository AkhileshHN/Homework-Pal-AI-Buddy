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
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
});
export type HomeworkBuddyInput = z.infer<typeof HomeworkBuddyInputSchema>;

const HomeworkBuddyOutputSchema = z.object({
  message: z.string().describe('The next message to the child, which could be a step, a hint, or a reward.'),
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

- Your main task is to provide the **very next step** or a **single hint**. Do not provide the whole solution at once.
- Analyze the conversation history to understand the child's progress.
- If the child is starting, provide the first step.
- If the child responds, provide the next logical step.
- If the child gets stuck or asks for a hint, provide a simple hint.
- Use simple words and short sentences.
- Be friendly and fun — sometimes use emojis 🎉⭐ to encourage the child.
- When the problem is fully solved, give the child a final reward message (e.g., “Great job! You earned a ⭐”).
- If the question is unclear, ask the child politely to repeat or explain.

Conversation History:
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

Based on the history, provide the next message.
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
