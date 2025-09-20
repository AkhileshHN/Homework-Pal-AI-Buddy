
"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { getHomeworkHelp } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Mic, Send, Star, User, LoaderCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { PalAvatar } from "./icons";
import { useToast } from "@/hooks/use-toast";
import type { HomeworkBuddyOutput } from "@/ai/flows/reasoning-based-guidance";

type Message = {
  id: number;
  type: "user" | "ai-step" | "ai-reward";
  text: string;
};

const initialState: (HomeworkBuddyOutput & { error?: string }) | null = null;

export function HomeworkPal() {
  const [formState, formAction] = useFormState(getHomeworkHelp, initialState);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [starCount, setStarCount] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const messageIdCounter = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!formState) return;

    setIsPending(false);

    if (formState.error) {
      toast({
        title: "Error",
        description: formState.error,
        variant: "destructive",
      });
      // Add an error message to conversation
      setConversation((prev) => [
        ...prev,
        {
          id: messageIdCounter.current++,
          type: "ai-step",
          text: "I'm sorry, I didn't understand that. Can you rephrase your question?",
        },
      ]);
      return;
    }

    const { steps, reward } = formState as HomeworkBuddyOutput;
    const newAiMessages: Message[] = [];

    if (steps) {
      steps.forEach((step) => {
        newAiMessages.push({
          id: messageIdCounter.current++,
          type: "ai-step",
          text: step,
        });
      });
    }

    if (reward) {
      newAiMessages.push({
        id: messageIdCounter.current++,
        type: "ai-reward",
        text: reward,
      });

      if (reward.includes("⭐") || reward.toLowerCase().includes("great job")) {
        setStarCount((prev) => prev + 1);
      }
    }

    let messageIndex = 0;
    const addMessageWithDelay = () => {
      if (messageIndex < newAiMessages.length) {
        setConversation((prev) => [...prev, newAiMessages[messageIndex]]);
        messageIndex++;
        setTimeout(addMessageWithDelay, 900);
      }
    };
    addMessageWithDelay();

  }, [formState, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const problem = formData.get("problem") as string;
    if (!problem.trim()) return;

    setIsPending(true);
    setConversation((prev) => [
      ...prev,
      { id: messageIdCounter.current++, type: "user", text: problem },
    ]);
    formAction(formData);
    formRef.current?.reset();
  };

  const StarCounter = ({ count }: { count: number }) => (
    <div className="flex items-center gap-2 rounded-full bg-accent/30 px-4 py-2 text-accent-foreground shadow-inner">
      <Star className="fill-accent text-accent" />
      <span className="font-bold text-lg" key={count}>{count}</span>
      <span className="sr-only">stars earned</span>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[85vh]">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <PalAvatar className="w-12 h-12" />
          <div>
            <h1 className="text-xl font-bold font-headline">Homework Pal</h1>
            <p className="text-sm text-muted-foreground">Your friendly AI study buddy</p>
          </div>
        </div>
        <div className="animate-star-pop">
           <StarCounter count={starCount} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  msg.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.type !== "user" && (
                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                   </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm md:text-base",
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none",
                    msg.type === "ai-reward" && "bg-accent/80 text-accent-foreground"
                  )}
                >
                  {msg.type === 'ai-reward' && <Lightbulb className="inline-block mr-2 w-4 h-4" />}
                  {msg.text}
                </div>
                 {msg.type === "user" && (
                   <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-secondary-foreground" />
                   </div>
                )}
              </div>
            ))}
            {isPending && (
              <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                   </div>
                <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t bg-card/80 backdrop-blur-sm">
        <form
          ref={formRef}
          onSubmit={handleFormSubmit}
          className="flex items-center w-full gap-2"
        >
          <Textarea
            name="problem"
            placeholder="Type your homework question here..."
            className="flex-1 resize-none bg-background text-base"
            rows={1}
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
           <Button type="button" size="icon" variant="ghost" disabled={isPending}>
            <Mic className="w-5 h-5" />
            <span className="sr-only">Use microphone</span>
          </Button>
          <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
