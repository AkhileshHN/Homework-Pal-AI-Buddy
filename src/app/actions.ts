
"use server";

import {
  homeworkBuddy,
  type HomeworkBuddyInput,
  type HomeworkBuddyOutput,
} from "@/ai/flows/reasoning-based-guidance";
import { z } from "zod";

const inputSchema = z.object({
  problem: z.string().min(1, "Please enter a problem."),
});

export async function getHomeworkHelp(
  prevState: any,
  formData: FormData
): Promise<HomeworkBuddyOutput | { error: string }> {
  const validatedFields = inputSchema.safeParse({
    problem: formData.get("problem"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.problem?.[0] || "Invalid input."
    };
  }

  try {
    const output = await homeworkBuddy({ problem: validatedFields.data.problem });
    return output;
  } catch (error) {
    console.error("Error getting homework help:", error);
    return {
      steps: [
        "Oops! I had a little trouble thinking. Could you please ask your question again?",
      ],
      reward: "Let's try that one more time! 🚀",
    };
  }
}
