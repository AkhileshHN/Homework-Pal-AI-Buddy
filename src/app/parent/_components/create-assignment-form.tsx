
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createAssignment } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

const initialState: {
  error?: { _form?: string[], title?: string[], description?: string[], stars?: string[] };
  success?: boolean;
} = {
  error: undefined,
  success: false,
};


export function CreateAssignmentForm() {
  const [state, formAction, isPending] = useActionState(createAssignment, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success!',
        description: 'Your new assignment has been created.',
      });
      formRef.current?.reset();
    } else if (state?.error?._form) {
      toast({
        title: 'Oh no!',
        description: state.error._form[0],
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Assignment</CardTitle>
        <CardDescription>Design a new quest for your student.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input id="title" name="title" placeholder="e.g., Math Adventure" />
            {state?.error?.title && <p className="text-sm text-destructive">{state.error.title[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Assignment Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="e.g., Solve 5 addition problems, or learn a rhyme like 'Twinkle Twinkle Little Star'."
            />
            {state?.error?.description && <p className="text-sm text-destructive">{state.error.description[0]}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="stars">Stars Awarded on Completion</Label>
            <Input id="stars" name="stars" type="number" min="1" defaultValue="1" />
            {state?.error?.stars && <p className="text-sm text-destructive">{state.error.stars[0]}</p>}
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <LoaderCircle className="animate-spin" /> : 'Create Quest'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
