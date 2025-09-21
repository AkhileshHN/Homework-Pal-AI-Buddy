
"use server";

import {
  homeworkBuddy,
  type HomeworkBuddyInput,
  HomeworkBuddyOutput,
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

type Assignment = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'new' | 'inprogress' | 'completed';
  stars: number;
};

const ASSIGNMENTS_FILE_PATH = path.join(process.cwd(), 'src/lib/assignments.json');

async function getAssignments(): Promise<{ assignments: Assignment[] }> {
  // Deployed environment (Netlify, Vercel, etc.)
  if (process.env.ASSIGNMENTS_JSON) {
    try {
      const data = JSON.parse(process.env.ASSIGNMENTS_JSON);
      return { assignments: data.assignments || [] };
    } catch (error) {
      console.error("Error parsing assignments from environment variable:", error);
      return { assignments: [] };
    }
  }

  // Local development environment
  try {
    const fileContent = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    return { assignments: data.assignments || [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist, return empty array
      return { assignments: [] };
    }
    console.error("Error reading local assignments file:", error);
    return { assignments: [] };
  }
}

async function saveAssignments(assignments: { assignments: Assignment[] }) {
  // In a serverless environment, we can't (and shouldn't) write to the filesystem.
  if (process.env.NETLIFY || process.env.VERCEL) {
    console.log("Simulating assignment save in serverless environment. Data is not persisted.");
    return;
  }

  // For local development, write to the file.
  try {
    await fs.writeFile(ASSIGNMENTS_FILE_PATH, JSON.stringify(assignments, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing local assignments file:", error);
  }
}


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
    
    // If the quest is over, mark it as completed.
    if (output.stage === 'REWARD') {
        const { assignments } = await getAssignments();
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
          assignments[assignmentIndex].status = 'completed';
          await saveAssignments({ assignments });
        }
        revalidatePath('/parent');
        revalidatePath('/play');
    }
    
    let audio = '';
    // Only generate audio if not in a local dev environment to avoid hitting rate limits
    if (process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.VERCEL) {
        try {
            const audioMessage = output.quizQuestion ? `${output.message} ${output.quizQuestion}` : output.message;
            const { audio: audioData } = await textToSpeech(audioMessage);
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
      stage: 'QUIZ',
      audio: "",
      starsEarned: 0
    };
  }
}

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  stars: z.coerce.number().min(1, 'Stars must be at least 1.'),
});

export async function createAssignment(prevState: any, formData: FormData) {
  // Prevent creation in a read-only serverless environment
  if (process.env.NETLIFY || process.env.VERCEL) {
      return { error: { _form: ["Assignment creation is disabled in this hosted environment. A database is required to persist data."] } };
  }

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
    // Prevent deletion in a read-only serverless environment
    if (process.env.NETLIFY || process.env.VERCEL) {
      return { error: 'Assignment deletion is disabled in this hosted environment. A database is required to persist data.' };
    }
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
