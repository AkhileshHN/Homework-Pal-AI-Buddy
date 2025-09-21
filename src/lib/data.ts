
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
  // First, check if the environment variable exists and is a non-empty string.
  if (process.env.ASSIGNMENTS_JSON && process.env.ASSIGNMENTS_JSON.trim()) {
    try {
      // The environment variable is expected to be a stringified JSON object: `{"assignments": [...]}`
      const data = JSON.parse(process.env.ASSIGNMENTS_JSON);
      return sortAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error parsing assignments from environment variable, falling back to local file:", error);
      // If parsing fails for any reason, proceed to the fallback below.
    }
  }

  // Local development environment or fallback
  try {
    const fileContent = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    return sortAssignments(data.assignments || []);
  } catch (error) {
    // If the file doesn't exist, return an empty array.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; 
    }
    // For any other reading error, log it and return an empty array.
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
