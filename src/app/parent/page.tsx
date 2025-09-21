
import { CreateAssignmentForm } from './_components/create-assignment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, BookCheck, CheckCheck, LoaderCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DeleteAssignmentButton } from './_components/delete-assignment-button';
import { getAssignments, type Assignment } from '@/lib/data';

const StatusIcon = ({ status }: { status: Assignment['status'] }) => {
    switch (status) {
        case 'inprogress':
            return <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />;
        case 'completed':
            return <CheckCheck className="mr-2 h-4 w-4 text-green-500" />;
        default:
            return <BookCheck className="mr-2 h-4 w-4" />;
    }
}

export default async function ParentPage() {
  const assignments = await getAssignments();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Parent & Teacher Dashboard</h1>
        <p className="text-muted-foreground">Create and manage assignments for your little learners.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <CreateAssignmentForm />
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Current Assignments</CardTitle>
                            <CardDescription>
                                {assignments.length > 0 
                                    ? `You have ${assignments.length} assignment(s) active.`
                                    : "You have no active assignments."}
                            </CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/play">Go to Play Area</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {assignments.length > 0 ? (
                        <ul className="space-y-4">
                        {assignments.map((assignment) => (
                            <li key={assignment.id} className="flex items-start justify-between p-4 rounded-lg border bg-card-foreground/5">
                                <div>
                                    <div className="flex items-center">
                                         {assignment.status === 'completed' && <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>}
                                         {assignment.status === 'inprogress' && <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>}
                                        <h3 className="font-semibold">{assignment.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description.split('##LEARNING##')[1]?.split('##QUIZ##')[0]?.trim() || 'No description available.'}</p>
                                    <div className="flex items-center text-xs text-muted-foreground/50 mt-1">
                                        <span>
                                            Created on: {new Date(assignment.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="mx-2">|</span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            <span>{assignment.stars} star{assignment.stars > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant={assignment.status === 'completed' ? 'outline' : 'secondary'} size="sm" disabled={assignment.status === 'completed'}>
                                        <Link href={`/play/${assignment.id}`}>
                                            <StatusIcon status={assignment.status} />
                                            {assignment.status === 'completed' ? 'Completed' : (assignment.status === 'inprogress' ? 'In Progress' : 'Start Quest')}
                                        </Link>
                                    </Button>
                                    <DeleteAssignmentButton id={assignment.id} />
                                </div>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <List className="mx-auto h-12 w-12" />
                            <p className="mt-4">Assignment created is not showing</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
