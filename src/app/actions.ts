
"use server";

import {
  homeworkBuddy,
  type HomeworkBuddyInput,
  HomeworkBuddyOutput,
} from "@/ai/flows/reasoning-based-guidance";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { z } from "zod";
import { generateStory } from "@/ai/flows/story-generator";
import { designQuest } from "@/ai/flows/design-quest";

const inputSchema = z.object({
  assignment: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  assignmentId: z.string(),
});

export async function getHomeworkHelp(
  prevState: any,
  formData: FormData
): Promise<({ audio: string; } & HomeworkBuddyOutput) | { error: string }> {
  const historyStr = formData.get("history") as string;
  const assignment = formData.get("assignment") as string;
  const assignmentId = formData.get("assignmentId") as string;
  const starsToAward = parseInt(formData.get("starsToAward") as string, 10);
  
  let history = [];
  try {
    history = JSON.parse(historyStr);
  } catch (e) {
    return { error: 'Invalid history format.' };
  }

  const validatedFields = inputSchema.safeParse({ history, assignment, assignmentId });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.history?.[0] || "Invalid input."
    };
  }

  try {
    const output = await homeworkBuddy({ 
      assignment: validatedFields.data.assignment,
      history: validatedFields.data.history,
      stars: starsToAward,
    });
    
    let audio = '';
    // Generate audio only in production-like environments to save resources during local dev
    if (process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.VERCEL) {
        try {
            const audioMessage = output.quizQuestion ? `${output.message} ${output.quizQuestion}` : output.message;
            if (audioMessage.trim()) {
                const { audio: audioData } = await textToSpeech(audioMessage);
                audio = audioData;
            }
        } catch (error) {
            console.error("Text to speech failed, returning empty audio.", error);
        }
    }

    return { ...output, audio };
  } catch (error) {
    console.error("Error getting homework help:", error);
    return {
      message: "Oops! I had a little trouble thinking. Could you please ask your question again?",
      stage: 'QUIZ',
      audio: "",
      starsEarned: 0
    };
  }
}

const storyInputSchema = z.object({
  assignment: z.string(),
});

export async function getGamifiedStory(input: { assignment: string }) {
  const validatedFields = storyInputSchema.safeParse(input);

  if (!validatedFields.success) {
    throw new Error("Invalid input for story generation.");
  }

  try {
    const story = await generateStory({ assignment: validatedFields.data.assignment });
    let audio: TextToSpeechOutput = { audio: '' };
    // Generate audio only in production-like environments
    if (process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.VERCEL) {
        if (story.story) {
            try {
                audio = await textToSpeech(story.story);
            } catch (error) {
                console.error("Text to speech failed for story, returning empty audio.", error);
            }
        }
    }
    return {...story, ...audio};
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Could not generate a story for the assignment.");
  }
}
