
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
import { revalidatePath } from "next/cache";
import { designQuest } from "@/ai/flows/design-quest";

const inputSchema = z.object({
  assignment: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  assignmentId: z.string(),
});

const assignmentsFilePath = path.join(process.cwd(), 'src', 'lib', 'assignments.json');

type Assignment = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'new' | 'inprogress' | 'completed';
  stars: number;
};

async function getAssignments(): Promise<{assignments: Assignment[]}> {
  try {
    const data = await fs.readFile(assignmentsFilePath, 'utf-8');
    if (!data) {
        return { assignments: [] };
    }
    const jsonData = JSON.parse(data);
    return { assignments: jsonData.assignments || [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
      return { assignments: [] }; // File not found or invalid JSON, return empty
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
    
    // Don't generate audio for reward messages.
    if (output.message.includes("⭐")) {
        // This is the final reward, so mark as completed
        const { assignments } = await getAssignments();
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
          assignments[assignmentIndex].status = 'completed';
          await saveAssignments({ assignments });
        }
        revalidatePath('/parent');
        revalidatePath('/play');
        return { ...output, audio: "" };
    }
    
    let audio = '';
    // Only generate audio in production to avoid hitting rate limits in dev
    if (process.env.NODE_ENV === 'production') {
        try {
            const { audio: audioData } = await textToSpeech(output.message);
            audio = audioData;
        } catch (error) {
            console.error("Text to speech failed, returning empty audio.", error);
        }
    }

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
  stars: z.coerce.number().min(1, 'Stars must be at least 1.'),
});

export async function createAssignment(prevState: any, formData: FormData) {
  const validatedFields = createAssignmentSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    stars: formData.get('stars'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description, stars } = validatedFields.data;

  try {
    // Generate the full quest content from the description
    const questResult = await designQuest({ description });
    const fullQuest = questResult.designedQuest;


    const data = await getAssignments();
    const newAssignment = {
      id: Date.now().toString(),
      title,
      description: fullQuest, // Store the full, AI-generated quest
      createdAt: new Date().toISOString(),
      status: 'new' as const,
      stars,
    };
    data.assignments.push(newAssignment);
    await saveAssignments(data);
    revalidatePath('/parent');
    revalidatePath('/play');
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
    // Only generate audio in production to avoid hitting rate limits in dev
    if (process.env.NODE_ENV === 'production') {
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

export async function updateAssignmentStatus(id: string, status: 'new' | 'inprogress' | 'completed') {
    try {
        const { assignments } = await getAssignments();
        const assignmentIndex = assignments.findIndex(a => a.id === id);
        if (assignmentIndex !== -1) {
            if (assignments[assignmentIndex].status === 'completed') return; // Don't change a completed quest
            assignments[assignmentIndex].status = status;
            await saveAssignments({ assignments });
        }
    } catch(error) {
        console.error("Failed to update assignment status", error);
        // We don't need to throw here, as it's not critical for the user flow
    }
}

export async function deleteAssignment(id: string) {
    try {
        const { assignments } = await getAssignments();
        const updatedAssignments = assignments.filter((a) => a.id !== id);
        await saveAssignments({ assignments: updatedAssignments });
        revalidatePath('/parent');
        revalidatePath('/play');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete assignment:', error);
        return { error: 'Failed to delete assignment.' };
    }
}
