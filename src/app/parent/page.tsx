import { promises as fs } from 'fs';
import path from 'path';
import { CreateAssignmentForm } from './_components/create-assignment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, BookCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Assignment = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

async function getAssignments(): Promise<Assignment[]> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'assignments.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data).assignments || [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // File not found, return empty array
    }
    throw error;
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
                                    <h3 className="font-semibold">{assignment.title}</h3>
                                    <p className="text-sm text-muted-foreground">{assignment.description}</p>
                                    <p className="text-xs text-muted-foreground/50 mt-1">
                                        Created on: {new Date(assignment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href={`/play/${assignment.id}`}>
                                        <BookCheck className="mr-2 h-4 w-4" />
                                        Start Quest
                                    </Link>
                                </Button>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <List className="mx-auto h-12 w-12" />
                            <p className="mt-4">No assignments yet. Create one to get started!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
