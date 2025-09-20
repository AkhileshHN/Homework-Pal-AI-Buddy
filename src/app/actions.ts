
"use server";

import {
  homeworkBuddy,
  type HomeworkBuddyInput,
} from "@/ai/flows/reasoning-based-guidance";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { z } from "zod";
import { promises as fs } from 'fs';
import path from 'path';
import { generateStory, type StoryGeneratorInput } from "@/ai/flows/story-generator";

const inputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
});

const assignmentsFilePath = path.join(process.cwd(), 'src', 'lib', 'assignments.json');

async function getAssignments() {
  try {
    const data = await fs.readFile(assignmentsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { assignments: [] }; // File not found, return empty
    }
    throw error;
  }
}

async function saveAssignments(assignments: any) {
  await fs.writeFile(assignmentsFilePath, JSON.stringify(assignments, null, 2), 'utf-8');
}


export async function getHomeworkHelp(
  prevState: any,
  formData: FormData
): Promise<{ message: string; audio: string; error?: string } | { error: string, message?: undefined, audio?: undefined }> {
  const historyStr = formData.get("history") as string;
  
  let history = [];
  try {
    history = JSON.parse(historyStr);
  } catch (e) {
    return { error: 'Invalid history format.' };
  }

  const validatedFields = inputSchema.safeParse({ history });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.history?.[0] || "Invalid input."
    };
  }

  try {
    const output = await homeworkBuddy({ history: validatedFields.data.history });
    
    // Don't generate audio for reward messages.
    if (output.message.includes("⭐")) {
        return { ...output, audio: "" };
    }
    
    const { audio } = await textToSpeech(output.message);

    return { ...output, audio };
  } catch (error) {
    console.error("Error getting homework help:", error);
    return {
      message: "Oops! I had a little trouble thinking. Could you please ask your question again?",
      audio: ""
    };
  }
}

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
});

export async function createAssignment(prevState: any, formData: FormData) {
  const validatedFields = createAssignmentSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description } = validatedFields.data;

  try {
    const data = await getAssignments();
    const newAssignment = {
      id: Date.now().toString(),
      title,
      description,
      createdAt: new Date().toISOString(),
    };
    data.assignments.push(newAssignment);
    await saveAssignments(data);
    return { success: true };
  } catch (error) {
    console.error('Failed to create assignment:', error);
    return { error: { _form: ['Failed to create assignment.'] } };
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
    if (story.story) {
        audio = await textToSpeech(story.story);
    }
    return {...story, ...audio};
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Could not generate a story for the assignment.");
  }
}
