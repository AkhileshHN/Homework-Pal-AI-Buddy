
"use server";

import {
  homeworkBuddy,
  type HomeworkBuddyInput,
} from "@/ai/flows/reasoning-based-guidance";
import { textToSpeech } from "@/ai/flows/text-to-speech";
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
