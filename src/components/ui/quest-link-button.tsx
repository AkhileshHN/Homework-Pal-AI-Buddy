
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuestLinkButtonProps = ButtonProps & {
  href: string;
};

export function QuestLinkButton({ href, children, onClick, ...props }: QuestLinkButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClick) {
        onClick(e);
    }
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Button onClick={handleClick} disabled={isPending} {...props}>
      {isPending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Loading Quest...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
