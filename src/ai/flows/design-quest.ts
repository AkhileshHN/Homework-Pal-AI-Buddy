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
    learning_material: z.string().optional().describe("A short, simple paragraph explaining the concept. If the assignment is for memorization, this should be the full text to memorize. If the description is a topic, generate a short learning paragraph about it."),
    quiz: z.string().describe("A numbered list of 5-10 multiple-choice questions based on the learning material. Each question should have 3-4 numbered options, and the correct answer must be marked with an asterisk (*)."),
  }) },
  prompt: `You are a curriculum designer for a children's game. Your job is to take a high-level goal from a parent or teacher and turn it into a concrete, two-part quest for a child (ages 6-12).

**Your Task:**
Based on the assignment description below, create a quest with a **Learning Section** and a **Quiz Section**.

Assignment Description: "{{description}}"

**Instructions:**

1.  **Analyze the Goal:** Determine if the goal is for **Concept Understanding** (e.g., math problems, science questions, or a general topic) or **Memorization** (e.g., learning a poem, a speech, or a song).

2.  **Generate the Quest Content:**
    *   **Learning Material:**
        *   For **Concept Understanding**, write a short, simple paragraph (2-4 sentences) that explains the core idea. Use very simple language. If the description is just a topic (e.g., "solar system"), create a simple educational paragraph about it.
        *   For **Memorization**, provide the full text of the piece to be memorized (like a poem or rhyme). The quiz for memorization should NOT be multiple choice.
    *   **Quiz:**
        *   Create a numbered list of at least 5 and at most 10 questions.
        *   For **Concept Understanding** tasks, each question must be **multiple-choice** with 3-4 numbered options. Mark the correct answer with an asterisk (*).
        *   For **Memorization** tasks, the "quiz" will be the child repeating the lines, so it should be a list of lines, not multiple-choice.

3.  **Format the Output:** Structure your response into the 'learning_material' and 'quiz' fields.

**Example 1 (Concept Understanding):**
Description: "Learn about the planets in our solar system."
Output:
learning_material: "Our solar system has amazing planets! Mercury is closest to the sun, and Neptune is the farthest. Mars is called the Red Planet, and Jupiter is the biggest of all. We live on a beautiful planet called Earth!"
quiz: "1. What is the biggest planet?\n  1) Mars\n  2) Jupiter*\n  3) Earth\n2. Which planet is called the Red Planet?\n  1) Mars*\n  2) Venus\n  3) Saturn\n3. What is the name of the planet we live on?\n  1) Mercury\n  2) Earth*\n  3) Neptune\n4. Which planet is farthest from the sun?\n  1) Jupiter\n  2) Uranus\n  3) Neptune*\n5. What is the closest planet to the Sun?\n  1) Mercury*\n  2) Earth\n  3) Mars"

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
