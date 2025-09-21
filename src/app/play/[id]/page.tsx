
import { notFound } from 'next/navigation';
import { HomeworkPal } from '@/components/homework-pal';
import { getGamifiedStory, updateAssignmentStatus } from '@/app/actions';
import { getAssignment } from '@/lib/data';

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
