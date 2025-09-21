
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { HomeworkPal } from '@/components/homework-pal';
import { getGamifiedStory, updateAssignmentStatus } from '@/app/actions';

type Assignment = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'new' | 'inprogress' | 'completed';
  stars: number;
};

const ASSIGNMENTS_FILE_PATH = path.join(process.cwd(), 'src/lib/assignments.json');

async function getAssignment(id: string): Promise<Assignment | undefined> {
  // Deployed environment (Netlify, Vercel, etc.)
  if (process.env.ASSIGNMENTS_JSON) {
    try {
      const data = JSON.parse(process.env.ASSIGNMENTS_JSON);
      return (data.assignments || []).find((a: Assignment) => a.id === id);
    } catch (error) {
      console.error("Error parsing assignments from environment variable:", error);
      return undefined;
    }
  }

  // Local development environment
  try {
    const fileContent = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    return (data.assignments || []).find((a: Assignment) => a.id === id);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    console.error("Error reading local assignments file:", error);
    return undefined;
  }
}

export default async function PlayAssignmentPage({ params }: { params: { id: string } }) {
  const assignment = await getAssignment(params.id);

  if (!assignment) {
    notFound();
  }
  
  // Set assignment to inprogress
  await updateAssignmentStatus(params.id, 'inprogress');


  let story;
  try {
      const learningMaterial = assignment.description.split('##LEARNING##')[1]?.split('##QUIZ##')[0]?.trim() || assignment.title;
      story = await getGamifiedStory({ assignment: learningMaterial });
  } catch(e) {
      // Fallback if AI story generation fails
      story = {
          title: assignment.title,
          story: `Let's get started with your assignment!`,
          audio: ''
      }
  }


  return (
    <div className="flex h-[calc(100vh-2rem)] w-full items-center justify-center p-4">
      <HomeworkPal 
        assignmentId={assignment.id}
        assignmentTitle={story.title}
        assignmentDescription={assignment.description}
        initialMessage={story.story}
        initialAudio={story.audio}
        starsToAward={assignment.stars}
      />
    </div>
  );
}
