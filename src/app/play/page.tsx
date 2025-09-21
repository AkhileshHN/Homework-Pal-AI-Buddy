
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCheck, Gamepad2 } from 'lucide-react';
import { getAssignments, type Assignment } from '@/lib/data';
import { QuestLinkButton } from '@/components/ui/quest-link-button';

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
  const assignments = (await getAssignments()).filter(a => a.status !== 'completed');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <div className="text-left">
            <h1 className="text-4xl font-bold font-headline">Select Your Quest!</h1>
            <p className="text-muted-foreground">An adventure in learning awaits.</p>
        </div>
        <Button asChild>
            <Link href="/parent">Go to Parent Dashboard</Link>
        </Button>
      </header>
      
      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(assignment => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-primary"/>
                    {assignment.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestLinkButton href={`/play/${assignment.id}`} className="w-full">
                  <BookCheck className="mr-2 h-4 w-4" />
                  {assignment.status === 'inprogress' ? 'Continue Quest' : 'Start Quest'}
                </QuestLinkButton>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
            <Gamepad2 className="mx-auto h-16 w-16" />
            <p className="mt-4 text-lg">No quests are available right now.</p>
            <p className="text-sm">Ask a parent or teacher to create one!</p>
            <Button asChild variant="link" className="mt-2">
                <Link href="/parent">Go to Parent Dashboard</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
