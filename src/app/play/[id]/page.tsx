
'use client';

import { notFound, useParams } from 'next/navigation';
import { HomeworkPal } from '@/components/homework-pal';
import { getGamifiedStory } from '@/app/actions';
import { useAssignments } from '@/hooks/use-assignments';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { Assignment } from '@/lib/data';


export default function PlayAssignmentPage() {
  const params = useParams<{ id: string }>();
  const { getAssignment, updateAssignmentStatus, isLoading } = useAssignments();
  const [story, setStory] = useState<{title: string, story: string, audio: string} | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const assignmentId = params.id;

  useEffect(() => {
    if (isLoading || !assignmentId) return;

    const currentAssignment = getAssignment(assignmentId);

    if (!currentAssignment) {
      // We can't use notFound() in a client component effect, so we'll handle loading/error states.
      setAssignment(null);
      return;
    }
    
    setAssignment(currentAssignment);

    if (currentAssignment.status !== 'completed') {
        updateAssignmentStatus(assignmentId, 'inprogress');
    }

    const fetchStory = async () => {
        try {
            const learningMaterial = currentAssignment.description.split('##LEARNING##')[1]?.split('##QUIZ##')[0]?.trim() || currentAssignment.title;
            const generatedStory = await getGamifiedStory({ assignment: learningMaterial });
            setStory(generatedStory);
        } catch(e) {
            // Fallback if AI story generation fails
            setStory({
                title: currentAssignment.title,
                story: `Let's get started with your assignment!`,
                audio: ''
            });
        }
    };

    fetchStory();

  }, [assignmentId, getAssignment, updateAssignmentStatus, isLoading]);
  
  if (isLoading || !story || !assignment) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center p-4">
            <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Preparing your quest...</p>
        </div>
      )
  }
  
  if (!assignment) {
    notFound();
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
        onComplete={() => updateAssignmentStatus(assignmentId, 'completed')}
      />
    </div>
  );
}
