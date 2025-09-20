import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { HomeworkPal } from '@/components/homework-pal';
import { getGamifiedStory } from '@/app/actions';

type Assignment = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

async function getAssignment(id: string): Promise<Assignment | undefined> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'assignments.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const assignments = JSON.parse(data).assignments || [];
    return assignments.find((a: Assignment) => a.id === id);
  } catch (error) {
     if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

export default async function PlayAssignmentPage({ params }: { params: { id: string } }) {
  const assignment = await getAssignment(params.id);

  if (!assignment) {
    notFound();
  }

  let story;
  try {
      story = await getGamifiedStory({ assignment: assignment.description });
  } catch(e) {
      // Fallback if AI story generation fails
      story = {
          title: assignment.title,
          story: `Let's get started with your assignment: ${assignment.description}. What's the first step?`,
          audio: ''
      }
  }


  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <HomeworkPal 
        assignmentTitle={story.title}
        assignmentDescription={assignment.description}
        initialMessage={story.story}
        initialAudio={story.audio}
      />
    </div>
  );
}
