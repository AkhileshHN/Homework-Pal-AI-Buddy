
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { designQuest } from '@/ai/flows/design-quest';
import { type Assignment } from '@/lib/data';

const initialState: {
  error?: { _form?: string[], title?: string[], description?: string[], stars?: string[] };
  success?: boolean;
} = {
  error: undefined,
  success: false,
};

type CreateAssignmentFormProps = {
    onCreate: (assignment: Assignment) => Promise<void>;
}

export function CreateAssignmentForm({ onCreate }: CreateAssignmentFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<{ title?: string[], description?: string[], stars?: string[], _form?: string[]}>({});
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const stars = Number(formData.get('stars'));

    const newErrors: typeof errors = {};
    if (!title) newErrors.title = ["Title is required."];
    if (!description) newErrors.description = ["Description is required."];
    if (stars < 1) newErrors.stars = ["Stars must be at least 1."];

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsPending(false);
        return;
    }

    try {
        const { designedQuest } = await designQuest({ description });

        const newAssignment: Assignment = {
          id: Date.now().toString(),
          title,
          description: designedQuest,
          createdAt: new Date().toISOString(),
          status: 'new' as const,
          stars,
        };

        await onCreate(newAssignment);
        
        toast({
            title: 'Success!',
            description: 'Your new assignment has been created.',
        });
        formRef.current?.reset();

    } catch (error) {
        console.error('Failed to create assignment:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setErrors({ _form: [`Failed to create assignment: ${errorMessage}`] });
        toast({
            title: 'Oh no!',
            description: `Failed to create assignment: ${errorMessage}`,
            variant: 'destructive',
        });
    } finally {
        setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Assignment</CardTitle>
        <CardDescription>Design a new quest for your student.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input id="title" name="title" placeholder="e.g., Math Adventure" />
            {errors?.title && <p className="text-sm text-destructive">{errors.title[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Assignment Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="e.g., Solve 5 addition problems, or learn a rhyme like 'Twinkle Twinkle Little Star'."
            />
            {errors?.description && <p className="text-sm text-destructive">{errors.description[0]}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="stars">Stars Awarded on Completion</Label>
            <Input id="stars" name="stars" type="number" min="1" defaultValue="1" />
            {errors?.stars && <p className="text-sm text-destructive">{errors.stars[0]}</p>}
          </div>
          {errors?._form && <p className="text-sm text-destructive">{errors._form[0]}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <LoaderCircle className="animate-spin" /> : 'Create Quest'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
