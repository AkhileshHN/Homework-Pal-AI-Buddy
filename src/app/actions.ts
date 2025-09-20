
"use server";

import {
  homeworkBuddy,
  type HomeworkBuddyInput,
  type HomeworkBuddyOutput,
} from "@/ai/flows/reasoning-based-guidance";
import { z } from "zod";

const inputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
});

export async function getHomeworkHelp(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string } | { error: string, message?: undefined }> {
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
    return output;
  } catch (error) {
    console.error("Error getting homework help:", error);
    return {
      message: "Oops! I had a little trouble thinking. Could you please ask your question again?",
    };
  }
}
