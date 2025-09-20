'use server';

/**
 * @fileOverview An AI flow that designs a full quest from a simple description.
 *
 * - designQuest - Creates a structured quest plan.
 * - DesignQuestInput - The input type for the designQuest function.
 * - DesignQuestOutput - The return type for the designQuest function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DesignQuestInputSchema = z.object({
  description: z.string().describe('A simple description of the homework assignment goal.'),
});
export type DesignQuestInput = z.infer<typeof DesignQuestInputSchema>;

const DesignQuestOutputSchema = z.object({
  designedQuest: z.string().describe('The full, structured list of questions or lines for the assignment, formatted as a string.'),
});
export type DesignQuestOutput = z.infer<typeof DesignQuestOutputSchema>;

export async function designQuest(input: DesignQuestInput): Promise<DesignQuestOutput> {
  return designQuestFlow(input);
}

const designQuestPrompt = ai.definePrompt({
  name: 'designQuestPrompt',
  input: { schema: DesignQuestInputSchema },
  output: { schema: DesignQuestOutputSchema },
  prompt: `You are a curriculum designer for a children's game. Your job is to take a high-level goal from a parent or teacher and turn it into a concrete, step-by-step quest for a child (ages 6-12).

**Your Task:**
Based on the assignment description below, create the full, explicit content of the quest.

Assignment Description: "{{description}}"

**Instructions:**

1.  **Analyze the Goal:** Determine if the goal is for **Concept Understanding** (e.g., math problems, science questions) or **Memorization** (e.g., learning a poem, a speech, or a song).

2.  **Generate the Quest Content:**
    *   For **Concept Understanding**, generate a list of 5-10 simple, related problems or questions that align with the goal. Present them as a clear, numbered list. For example, if the goal is "simple addition," you should generate "1. 2+3=?, 2. 1+4=?, 3. 5+2=?".
    *   For **Memorization**, provide the full text of the piece to be memorized (like a poem or rhyme). Make sure to include the full, complete text, with each line on a new line. For example, if the goal is to learn "Twinkle, Twinkle, Little Star," you should write out the entire first verse.

3.  **Format as a Single String:** The entire output must be a single string containing the full quest content. For lists, use numbering. For texts, use line breaks.

**Example 1 (Concept Understanding):**
*Description: "Practice subtraction from 10."*
*Output: "1. 10 - 2 = ?\n2. 10 - 5 = ?\n3. 10 - 9 = ?\n4. 10 - 0 = ?\n5. 10 - 7 = ?"*

**Example 2 (Memorization):**
*Description: "Learn the 'Hey Diddle Diddle' nursery rhyme."*
*Output: "Hey, diddle, diddle,\nThe cat and the fiddle,\nThe cow jumped over the moon;\nThe little dog laughed\nTo see such sport,\nAnd the dish ran away with the spoon."*

Now, design the full quest for the assignment description provided.
`,
});

const designQuestFlow = ai.defineFlow(
  {
    name: 'designQuestFlow',
    inputSchema: DesignQuestInputSchema,
    outputSchema: DesignQuestOutputSchema,
  },
  async (input) => {
    const { output } = await designQuestPrompt(input);
    return output!;
  }
);
