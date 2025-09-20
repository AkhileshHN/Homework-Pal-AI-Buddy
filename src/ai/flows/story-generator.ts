'use server';

/**
 * @fileOverview An AI flow that generates a gamified story for a homework assignment.
 *
 * - generateStory - Creates a story-based intro for an assignment.
 * - StoryGeneratorInput - The input type for the generateStory function.
 * - StoryGeneratorOutput - The return type for the generateStory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StoryGeneratorInputSchema = z.object({
  assignment: z.string().describe('The homework assignment description.'),
});
export type StoryGeneratorInput = z.infer<typeof StoryGeneratorInputSchema>;

const StoryGeneratorOutputSchema = z.object({
  title: z.string().describe('A short, catchy, adventurous title for the story.'),
  story: z.string().describe('The introductory paragraph of the story that sets the scene and presents the first challenge based on the assignment.'),
});
export type StoryGeneratorOutput = z.infer<typeof StoryGeneratorOutputSchema>;

export async function generateStory(input: StoryGeneratorInput): Promise<StoryGeneratorOutput> {
  return storyGeneratorFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'storyGeneratorPrompt',
  input: { schema: StoryGeneratorInputSchema },
  output: { schema: StoryGeneratorOutputSchema },
  prompt: `You are a Creative Playwright for kids (ages 6-12). Your mission is to transform a standard homework assignment into a playful and imaginative script that helps a child learn.

Assignment: "{{assignment}}"

**Your Task:**

1.  **Analyze the Assignment:** First, determine the assignment's goal. Is it for **Concept Understanding** (e.g., solving math problems, learning a science principle) or **Memorization** (e.g., learning a poem, practicing vocabulary)?

2.  **Invent a Creative Scenario:**
    *   For **Concept Understanding**, create a problem-solving quest (e.g., Math Detective, Science Explorer).
    *   For **Memorization**, create a recall-based adventure (e.g., learning a magic spell, reciting a secret agent's code).

3.  **Create a Catchy Title:** Write a short, exciting title for this play-based quest.

4.  **Write the Opening Scene:**
    *   Write a short, engaging opening paragraph (2-3 sentences).
    *   Set the scene and introduce the child's role in the story.
    *   Present the very first problem from the assignment as a challenge within that story.
    *   Keep the language simple, encouraging, and exciting. Use an emoji!

**Example:**
*If the assignment is "2+2, 3+1", you could create a "Math Detective" scenario where the child must solve number clues to find a hidden treasure.*
*If the assignment is "Learn 'Twinkle, Twinkle'", you could create a "Starlight Chanter" scenario where the child must learn a magical song to make stars appear.*

Now, create a playful opening scene for the assignment above!
`,
});

const storyGeneratorFlow = ai.defineFlow(
  {
    name: 'storyGeneratorFlow',
    inputSchema: StoryGeneratorInputSchema,
    outputSchema: StoryGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await storyPrompt(input);
    return output!;
  }
);
