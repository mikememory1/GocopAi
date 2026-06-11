import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { QuizResult } from "@workspace/api-client-react";
import QuizRunner from "@/components/quiz/QuizRunner";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, Zap, Target } from "lucide-react";

type Step = "welcome" | "quiz";

export default function Onboarding() {
  const [step, setStep] = useState<Step>("welcome");
  const [, setLocation] = useLocation();
  const { user } = useUser();

  function handleQuizComplete(_result: QuizResult) {
    setLocation("/app");
  }

  if (step === "quiz") {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-2">
            Step 1 of 1
          </p>
          <h1 className="text-2xl font-bold">Business Maturity Audit</h1>
          <p className="text-muted-foreground mt-1">
            Answer honestly — this shapes your personalised action plan.
          </p>
        </div>
        <QuizRunner onComplete={handleQuizComplete} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono uppercase tracking-widest mb-2">
          Welcome to GoCopyAI
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {user?.firstName ? `Hey ${user.firstName},` : "Let's get started,"}
          <br />
          <span className="text-primary">where does your business stand?</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Before you start generating copy, take 2 minutes to complete your Business
          Maturity Audit. We use it to personalise every AI tool to your exact growth stage.
        </p>
      </div>

      <div className="grid gap-4 mb-10">
        {[
          {
            icon: BarChart2,
            title: "Benchmark your business",
            desc: "22 questions across 6 categories — marketing, sales, operations, and more.",
          },
          {
            icon: Target,
            title: "Get your AI action plan",
            desc: "A personalised roadmap generated for your exact stage of growth.",
          },
          {
            icon: Zap,
            title: "Unlock smarter copy",
            desc: "All AI tools are tuned to your maturity level and business context.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
          >
            <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="w-full sm:w-auto text-lg px-10 py-6 h-auto shadow-[0_0_20px_-5px_hsl(var(--primary))]"
          onClick={() => setStep("quiz")}
        >
          Start My Audit <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <button
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setLocation("/app")}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
