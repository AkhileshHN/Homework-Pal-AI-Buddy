import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PalAvatar } from "@/components/icons";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <PalAvatar className="w-24 h-24" />
            <div>
              <h1 className="text-5xl font-bold font-headline">Homework Pal</h1>
              <p className="text-xl text-muted-foreground">Your friendly AI study buddy</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/parent">I'm a Parent/Teacher</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/play">Let's Play!</Link>
            </Button>
          </div>
        </div>
    </div>
  );
}
