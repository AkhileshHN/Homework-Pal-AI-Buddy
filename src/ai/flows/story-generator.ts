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
  prompt: `You are a Creative Playwright for kids (ages 6-12). Your mission is to transform a standard homework assignment into a playful and imaginative script that helps a child understand the core concept through a fun scenario.

Assignment: "{{assignment}}"

**Your Task:**

1.  **Invent a Creative Scenario:** Based on the assignment, create a fun role for the child (e.g., a space explorer, a secret agent, a chef, a detective).
2.  **Create a Catchy Title:** Write a short, exciting title for this play-based quest.
3.  **Write the Opening Scene:**
    *   Write a short, engaging opening paragraph (2-3 sentences).
    *   Set the scene and introduce the child's role in the story.
    *   Present the very first problem from the assignment as a challenge within that story.
    *   Keep the language simple, encouraging, and exciting. Use an emoji!

**Example:**
*If the assignment is "2+2, 3+1", you could create a "Secret Agent" scenario where the child must solve number codes.*

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
