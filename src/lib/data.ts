
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

let memoryCache: Assignment[] | null = null;

export async function getAssignments(): Promise<Assignment[]> {
  // On deployed environments, use an in-memory cache to persist data
  // for the lifetime of the serverless function instance.
  if ((process.env.NETLIFY || process.env.VERCEL) && memoryCache) {
    return sortAssignments(memoryCache);
  }

  const envAssignments = process.env.ASSIGNMENTS_JSON;

  // Deployed environment (Netlify, Vercel, etc.)
  if (envAssignments && envAssignments.trim()) {
    try {
      const data = JSON.parse(envAssignments);
      memoryCache = data.assignments || [];
      return sortAssignments(memoryCache as Assignment[]);
    } catch (error) {
      console.error("Error parsing assignments from environment variable, falling back to local file:", error);
    }
  }

  // Local development environment or fallback
  try {
    const fileContent = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    memoryCache = data.assignments || [];
    return sortAssignments(memoryCache as Assignment[]);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      memoryCache = [];
      return []; 
    }
    console.error("Error reading local assignments file:", error);
    memoryCache = [];
    return [];
  }
}


export async function getAssignment(id: string): Promise<Assignment | undefined> {
    const assignments = await getAssignments();
    return assignments.find(a => a.id === id);
}


export async function saveAssignments(assignments: { assignments: Assignment[] }) {
  // In a serverless environment, we update the in-memory cache.
  if (process.env.NETLIFY || process.env.VERCEL) {
    memoryCache = assignments.assignments;
    return;
  }

  // For local development, write to the filesystem.
  try {
    await fs.writeFile(ASSIGNMENTS_FILE_PATH, JSON.stringify(assignments, null, 2), 'utf-8');
    memoryCache = assignments.assignments;
  } catch (error) {
    console.error("Error writing local assignments file:", error);
  }
}
