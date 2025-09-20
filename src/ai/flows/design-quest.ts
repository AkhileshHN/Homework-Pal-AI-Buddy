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
  designedQuest: z.string().describe('The full, structured content of the quest, including learning material and a quiz.'),
});
export type DesignQuestOutput = z.infer<typeof DesignQuestOutputSchema>;


export async function designQuest(input: DesignQuestInput): Promise<DesignQuestOutput> {
  return designQuestFlow(input);
}

const designQuestPrompt = ai.definePrompt({
  name: 'designQuestPrompt',
  input: { schema: DesignQuestInputSchema },
  output: { schema: z.object({
    learning_material: z.string().optional().describe("A short, simple paragraph explaining the concept. If the assignment is for memorization, this should be the full text to memorize."),
    quiz: z.string().describe("A numbered list of 3-5 simple questions or problems based on the learning material. Each question should be on a new line."),
  }) },
  prompt: `You are a curriculum designer for a children's game. Your job is to take a high-level goal from a parent or teacher and turn it into a concrete, two-part quest for a child (ages 6-12).

**Your Task:**
Based on the assignment description below, create a quest with a **Learning Section** and a **Quiz Section**.

Assignment Description: "{{description}}"

**Instructions:**

1.  **Analyze the Goal:** Determine if the goal is for **Concept Understanding** (e.g., math problems, science questions) or **Memorization** (e.g., learning a poem, a speech, or a song).

2.  **Generate the Quest Content:**
    *   **Learning Material:**
        *   For **Concept Understanding**, write a short, simple paragraph (2-4 sentences) that explains the core idea. Use very simple language.
        *   For **Memorization**, provide the full text of the piece to be memorized (like a poem or rhyme).
    *   **Quiz:**
        *   Create a numbered list of 3-5 simple questions or problems that test the information from the learning material.
        *   For concept tasks, the questions should be direct applications of the concept.
        *   For memorization tasks, the "quiz" will be the child repeating the lines, but you should still format it as a list of lines.

3.  **Format the Output:** Structure your response into the 'learning_material' and 'quiz' fields.

**Example 1 (Concept Understanding):**
Description: "Practice subtraction from 10."
Output:
learning_material: "Subtraction is like taking things away! When you subtract from 10, you are finding out how much is left. For example, if you have 10 apples and eat 2, you have 8 left."
quiz: "1. 10 - 2 = ?\n2. 10 - 5 = ?\n3. 10 - 9 = ?\n4. 10 - 0 = ?\n5. 10 - 7 = ?"

**Example 2 (Memorization):**
Description: "Learn the 'Hey Diddle Diddle' nursery rhyme."
Output:
learning_material: "Hey, diddle, diddle,\nThe cat and the fiddle,\nThe cow jumped over the moon;\nThe little dog laughed\nTo see such sport,\nAnd the dish ran away with the spoon."
quiz: "1. Hey, diddle, diddle,\n2. The cat and the fiddle,\n3. The cow jumped over the moon;\n4. The little dog laughed\n5. To see such sport,\n6. And the dish ran away with the spoon."

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
    if (!output) {
      throw new Error("Failed to generate quest design.");
    }
    
    // Combine the learning material and quiz into a single string for storage.
    const designedQuest = `##LEARNING##\n${output.learning_material || ''}\n\n##QUIZ##\n${output.quiz}`;

    return { designedQuest };
  }
);
