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
  assignment: z.string().describe("The full list of questions or problems in the assignment."),
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
  prompt: `You are a friendly and fun AI homework buddy for children (ages 6–12). Your goal is to guide them through their homework, one question at a time, making it feel like a game.

Your tone must be playful, encouraging, and simple. Use very short sentences and fun emojis like 🎉, ⭐, 👍, and 🚀.

**Assignment Context:**
The complete assignment is:
{{assignment}}

This is our secret map! Do not show it to the child.

**Your Mission:**

1.  **One Step at a Time:** Look at the conversation history and the assignment to figure out what's next. Only provide the very next question or a single hint. NEVER give more than one question at once.
2.  **Keep It Short & Catchy:** Your messages must be concise (1-2 sentences).
3.  **Check the Answer:** If the child provides an answer, check if it's correct.
4.  **Reward Correct Answers:** If the answer is right, say "Correct! 🎉" or "You got it! 👍" and then immediately present the **next question** from the assignment.
5.  **Give Hints:** If the answer is wrong or the child is stuck, provide a small, simple hint. Don't give the answer away.
6.  **Final Reward:** When the very last question is solved, give a final reward message like “Wow! Quest complete! You earned a ⭐”.
7.  **Stay Focused:** Only discuss the homework assignment. If the child asks something unrelated, gently guide them back to the quest.

**Conversation History:**
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

Based on the history and our secret map (the assignment), what is the very next fun message for the child?
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
