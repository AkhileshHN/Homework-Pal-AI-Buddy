
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { getHomeworkHelp } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Mic, Send, Star, User, LoaderCircle, Lightbulb, X, CheckCheck, Trophy, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { PalAvatar } from "./icons";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import type { HomeworkBuddyOutput } from "@/ai/flows/reasoning-based-guidance";

type Message = {
  id: number;
  role: "user" | "model";
  content: string;
  quizQuestion?: string;
  quizOptions?: string[];
};

const initialState: ({ audio: string; } & HomeworkBuddyOutput) | { error: string } | null = null;

type HomeworkPalProps = {
  initialMessage?: string;
  initialAudio?: string;
  assignmentTitle?: string;
  assignmentDescription?: string;
  assignmentId: string;
  starsToAward?: number;
};

export function HomeworkPal({ initialMessage, initialAudio, assignmentTitle, assignmentDescription, assignmentId, starsToAward = 1 }: HomeworkPalProps) {
  const [state, formAction, isFormPending] = useActionState(getHomeworkHelp, initialState);
  const [isTransitioning, startTransition] = useTransition();
  const isPending = isFormPending || isTransitioning;

  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentStage, setCurrentStage] = useState<'LEARNING' | 'QUIZ' | 'REWARD'>('LEARNING');
  const [starCount, setStarCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const router = useRouter();
  const messageIdCounter = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for SpeechRecognition API on the client after mount
    const recognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechRecognition(() => recognitionApi);
  }, []);

  useEffect(() => {
    if (initialMessage && conversation.length === 0) {
      const firstMessage: Message = {
        id: messageIdCounter.current++,
        role: "model",
        content: initialMessage,
      };
      setConversation([firstMessage]);
       if (initialAudio && audioRef.current) {
        audioRef.current.src = initialAudio;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      }
    }
  }, [initialMessage, initialAudio, conversation.length]);


  useEffect(() => {
    if (!state) return;

    setSelectedOption(null); // Clear selected option when response is received

    if ("error" in state && state.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      });
      setConversation((prev) => [
        ...prev,
        {
          id: messageIdCounter.current++,
          role: "model",
          content: "I'm sorry, I didn't understand that. Can you rephrase your question?",
        },
      ]);
      return;
    }
    
    if ("message" in state && state.message) {
       const newAiMessage: Message = {
        id: messageIdCounter.current++,
        role: "model",
        content: state.message,
        quizQuestion: state.quizQuestion,
        quizOptions: state.quizOptions,
      };

      setConversation((prev) => [...prev, newAiMessage]);
      setCurrentStage(state.stage);

      if (state.starsEarned && state.starsEarned > 0) {
        setStarCount((prev) => prev + state.starsEarned!);
      }

      if (state.stage === 'REWARD') {
        setIsComplete(true);
      }
      
      if ("audio" in state && state.audio && audioRef.current) {
        audioRef.current.src = state.audio;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      }
    }
    
    formRef.current?.reset();
  }, [state, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleFormSubmit = (formData: FormData) => {
    const problem = formData.get("problem") as string | null;

    if (currentStage !== 'LEARNING' && (!problem || !problem.trim())) {
      return;
    }

    const newUserMessage: Message = {
      id: messageIdCounter.current++,
      role: 'user',
      content: problem || "Let's start the quiz!",
    };
    
    const newConversation = [...conversation, newUserMessage];
    setConversation(newConversation);

    const historyForAction = newConversation.map(m => ({role: m.role, content: m.content}));
    
    formData.set('history', JSON.stringify(historyForAction));
    formData.set('assignmentId', assignmentId);
    formData.set('starsToAward', String(starsToAward));
    if (assignmentDescription) {
        formData.set('assignment', assignmentDescription);
    }
    formAction(formData);
  }

  const handleQuizOptionClick = (option: string) => {
    setSelectedOption(option);

    const newUserMessage: Message = {
      id: messageIdCounter.current++,
      role: "user",
      content: option,
    };
    const newConversation = [...conversation, newUserMessage];
    setConversation(newConversation);

    const historyForAction = newConversation.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const formData = new FormData();
    formData.append("problem", option);
    formData.append("history", JSON.stringify(historyForAction));
    formData.append("assignmentId", assignmentId);
    formData.append("starsToAward", String(starsToAward));
    if (assignmentDescription) {
      formData.append("assignment", assignmentDescription);
    }

    startTransition(() => {
        formAction(formData);
    });
  };

  const handleMicClick = () => {
    if (!speechRecognition) {
        toast({
            title: "Browser Not Supported",
            description: "Your browser doesn't support voice recognition.",
            variant: "destructive",
        });
        return;
    }

    if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
        return;
    }

    recognitionRef.current = new speechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
        setIsRecording(true);
        toast({ title: "Listening...", description: "Start speaking your answer."});
    };

    recognitionRef.current.onend = () => {
        setIsRecording(false);
    };

    recognitionRef.current.onerror = (event: any) => {
        setIsRecording(false);
        toast({
            title: "Voice Recognition Error",
            description: `Error: ${event.error}. Please try again.`,
            variant: "destructive",
        });
    };

    recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newFormData = new FormData(formRef.current!);
        newFormData.set('problem', transcript);
        handleFormSubmit(newFormData);
    };

    recognitionRef.current.start();
  };


  const StarCounter = ({ count }: { count: number }) => (
    <div className="flex items-center gap-2 rounded-full bg-accent/30 px-4 py-2 text-accent-foreground shadow-inner">
      <Star className="fill-accent text-accent" />
      <span className="font-bold text-lg" key={count}>{count}</span>
      <span className="sr-only">stars earned</span>
    </div>
  );

  const getMessageType = (message: Message) => {
    if (message.role === 'user') return 'user';
    if (currentStage === 'REWARD' && message.id === conversation[conversation.length - 1].id) {
      return 'ai-reward';
    }
    return 'ai-step';
  }
  
  const ExitButton = () => {
      if (isComplete) {
          return (
             <Button asChild variant="ghost" size="icon">
                <Link href="/play" aria-label="Exit Quest">
                    <X className="h-6 w-6" />
                </Link>
            </Button>
          )
      }
      
      return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" aria-label="Exit Quest">
                    <X className="h-6 w-6" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your progress on this quest is not finished yet. If you leave now, you can
                        always come back and continue where you left off.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Stay</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/play')}>
                        Exit Quest
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )
  }

  const lastMessage = conversation[conversation.length - 1];
  const showQuizOptions = currentStage === 'QUIZ' && lastMessage?.role === 'model' && lastMessage.quizOptions && lastMessage.quizOptions.length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <PalAvatar className="w-12 h-12" />
          <div>
            <CardTitle className="text-xl font-bold font-headline">{assignmentTitle || 'Homework Pal'}</CardTitle>
            <p className="text-sm text-muted-foreground">{assignmentTitle ? 'Let the adventure begin!' : 'Your friendly AI study buddy'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={cn(isComplete && "hidden")}>
               <StarCounter count={starCount} />
            </div>
             {isComplete && (
              <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-green-700 font-bold">
                <CheckCheck />
                <span>Quest Complete!</span>
              </div>
            )}
            <ExitButton />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {conversation.map((msg) => {
              const messageType = getMessageType(msg);
              return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  messageType === "user" ? "justify-end" : "justify-start"
                )}
              >
                {messageType !== "user" && (
                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                   </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm md:text-base",
                    messageType === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none",
                    messageType === "ai-reward" && "bg-accent/80 text-accent-foreground"
                  )}
                >
                  {messageType === 'ai-reward' && <Trophy className="inline-block mr-2 w-4 h-4" />}
                   <p className="font-bold whitespace-pre-wrap">{msg.quizQuestion}</p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                 {messageType === "user" && (
                   <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-secondary-foreground" />
                   </div>
                )}
              </div>
            )})}
            {isPending && !selectedOption && (
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
        {isComplete ? (
           <div className="w-full text-center p-4">
            <Trophy className="mx-auto w-12 h-12 text-yellow-500" />
            <h3 className="text-xl font-bold mt-2">Congratulations!</h3>
            <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{conversation.length > 0 && conversation[conversation.length - 1].content}</p>
            <div className="flex justify-center gap-4">
                <Button asChild>
                    <Link href="/play">
                        <Home className="mr-2 h-4 w-4" />
                        Choose a New Quest
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href="/parent">Parent Dashboard</Link>
                </Button>
            </div>
           </div>
        ) : (
        <form
          ref={formRef}
          action={handleFormSubmit}
          className="flex items-center w-full gap-2"
        >
          {currentStage === 'LEARNING' ? (
             <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <LoaderCircle className="animate-spin" /> : 'Start Quiz!'}
             </Button>
          ) : showQuizOptions ? (
             <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                {lastMessage.quizOptions?.map((option, index) => {
                  const isSkipButton = option.toLowerCase().includes('skip');
                  const isSelected = selectedOption === option;
                  
                  return (
                    <Button
                        key={index}
                        type="button"
                        variant={isPending && isSelected ? "default" : (isSkipButton ? "secondary" : "outline")}
                        className={cn("h-auto py-3 text-base justify-start text-left", isSkipButton && "md:col-span-2")}
                        onClick={() => handleQuizOptionClick(option)}
                        disabled={isPending}
                    >
                      {isPending && isSelected ? (
                        <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        !isSkipButton && <span className={cn("mr-2 font-bold", isSelected ? "text-primary-foreground" : "text-primary")}>{String.fromCharCode(65 + index)}:</span>
                      )}
                        {option}
                    </Button>
                  )
                })}
             </div>
          ) : (
            <>
              <Textarea
                name="problem"
                placeholder={"What is your answer?"}
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" onClick={handleMicClick} disabled={isPending || !speechRecognition}>
                        <Mic className="w-5 h-5" />
                        {isRecording && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                        <span className="sr-only">Use microphone</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {speechRecognition ? (isRecording ? 'Stop recording' : 'Start recording') : 'Voice recognition not supported'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button type="submit" size="icon" disabled={isPending}>
                {isPending ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                <span className="sr-only">Send message</span>
              </Button>
            </>
          )}
        </form>
        )}
      </CardFooter>
      <audio ref={audioRef} className="hidden" />
    </Card>
  );
}

    

    