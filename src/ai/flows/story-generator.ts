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
  prompt: `You are a master storyteller for kids (ages 6-12). Your job is to turn a boring homework assignment into an exciting adventure.

Assignment: "{{assignment}}"

Instructions:
1.  Create a short, catchy, and adventurous title for this quest (e.g., "Mathronauts to the Rescue!").
2.  Write a single, short and engaging introductory paragraph (2-3 sentences max).
3.  The paragraph must set a fun scene (e.g., enchanted forest, outer space, mysterious castle).
4.  It must introduce a clear first challenge or question that is directly related to the assignment.
5.  End the paragraph by asking the child to solve that first challenge. Keep it simple and direct.
6.  The tone should be playful, encouraging, and exciting. Use an emoji!
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
