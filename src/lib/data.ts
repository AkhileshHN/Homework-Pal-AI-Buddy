
import { promises as fs } from 'fs';
import path from 'path';

export type Assignment = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'new' | 'inprogress' | 'completed';
  stars: number;
};

const ASSIGNMENTS_FILE_PATH = path.join(process.cwd(), 'src/lib/assignments.json');

// Helper function to sort assignments by creation date
const sortAssignments = (assignments: Assignment[]) => {
  return assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export async function getAssignments(): Promise<Assignment[]> {
  // Deployed environment (Netlify, Vercel, etc.)
  // Check if the environment variable is a non-empty string before parsing.
  if (process.env.ASSIGNMENTS_JSON && process.env.ASSIGNMENTS_JSON.trim().length > 2) {
    try {
      // The environment variable is expected to be a stringified JSON object: `{"assignments": [...]}`
      const data = JSON.parse(process.env.ASSIGNMENTS_JSON);
      return sortAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error parsing assignments from environment variable:", error);
      // Fallback to local file if parsing fails
    }
  }

  // Local development environment or fallback
  try {
    const fileContent = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    return sortAssignments(data.assignments || []);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File doesn't exist, which is fine for a fresh start.
    }
    console.error("Error reading local assignments file:", error);
    return [];
  }
}


export async function getAssignment(id: string): Promise<Assignment | undefined> {
    const assignments = await getAssignments();
    return assignments.find(a => a.id === id);
}


export async function saveAssignments(assignments: { assignments: Assignment[] }) {
  // In a serverless environment, we can't (and shouldn't) write to the filesystem.
  // This function will only work for local development.
  if (process.env.NETLIFY || process.env.VERCEL) {
    console.log("Simulating assignment save in serverless environment. Data is not persisted.");
    return;
  }

  try {
    await fs.writeFile(ASSIGNMENTS_FILE_PATH, JSON.stringify(assignments, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing local assignments file:", error);
  }
}
