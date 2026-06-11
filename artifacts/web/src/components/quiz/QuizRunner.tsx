import { useState, useMemo } from "react";
import { useGetQuizQuestions, useSubmitQuiz, QuizQuestion, QuizSubmissionAnswers, QuizResult } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import QuizResultsView from "./QuizResultsView";

interface QuizRunnerProps {
  onComplete?: (result: QuizResult) => void;
}

export default function QuizRunner({ onComplete }: QuizRunnerProps = {}) {
  const { data: questions, isLoading, isError } = useGetQuizQuestions();
  const submitQuiz = useSubmitQuiz();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizSubmissionAnswers>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const sortedQuestions = useMemo(() => {
    if (!questions) return [];
    return [...questions].sort((a, b) => a.id.localeCompare(b.id));
  }, [questions]);

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-muted-foreground animate-pulse">Loading business maturity model...</div>
    </div>;
  }

  if (isError || !questions || questions.length === 0) {
    return <div className="p-6 text-center text-destructive border border-destructive/20 rounded-lg bg-destructive/10">
      Failed to load quiz. Please try again later.
    </div>;
  }

  if (result) {
    return <QuizResultsView result={result} onDone={onComplete ? () => onComplete(result) : undefined} />;
  }

  const currentQuestion = sortedQuestions[currentIndex];
  const progress = ((currentIndex) / sortedQuestions.length) * 100;
  
  const handleNext = () => {
    if (currentIndex < sortedQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      submitQuiz.mutate({ data: { answers } }, {
        onSuccess: (data) => setResult(data),
      });
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSingleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleMultipleAnswer = (value: string, checked: boolean) => {
    const current = answers[currentQuestion.id] || "";
    let selected = current ? current.split(",") : [];
    
    if (checked) {
      selected.push(value);
    } else {
      selected = selected.filter(v => v !== value);
    }
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selected.join(",") }));
  };

  const handleLikertAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const hasAnswer = () => {
    const ans = answers[currentQuestion.id];
    return ans !== undefined && ans !== "";
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card border-border shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1">
        <Progress value={progress} className="h-1 rounded-none bg-secondary" />
      </div>
      
      <CardHeader className="pt-8">
        <div className="flex justify-between items-center mb-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          <span>Question {currentIndex + 1} of {sortedQuestions.length}</span>
          <span>{currentQuestion.category}</span>
        </div>
        <CardTitle className="text-2xl md:text-3xl leading-tight">{currentQuestion.text}</CardTitle>
      </CardHeader>
      
      <CardContent className="min-h-[300px] flex flex-col justify-center">
        {currentQuestion.type === 'single' && (
          <RadioGroup 
            value={answers[currentQuestion.id] || ""} 
            onValueChange={handleSingleAnswer}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 border border-border p-4 rounded-md hover:bg-secondary/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleSingleAnswer(option.value)}>
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {currentQuestion.type === 'multiple' && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const selected = (answers[currentQuestion.id] || "").split(",");
              const isChecked = selected.includes(option.value);
              
              return (
                <div key={option.value} className="flex items-center space-x-3 border border-border p-4 rounded-md hover:bg-secondary/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleMultipleAnswer(option.value, !isChecked)}>
                  <Checkbox 
                    id={option.value} 
                    checked={isChecked}
                    onCheckedChange={(checked) => handleMultipleAnswer(option.value, !!checked)}
                  />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">{option.label}</Label>
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground italic mt-2">Select all that apply</p>
          </div>
        )}

        {currentQuestion.type === 'likert' && (
          <div className="space-y-6 mt-8">
            <RadioGroup 
              value={answers[currentQuestion.id] || ""} 
              onValueChange={handleLikertAnswer}
              className="flex justify-between items-center gap-2 md:gap-4"
            >
              {currentQuestion.options.map((option, idx) => (
                <div key={option.value} className="flex flex-col items-center space-y-3 flex-1">
                  <div className="hidden md:block h-8 text-xs text-center text-muted-foreground px-2">
                    {idx === 0 || idx === currentQuestion.options.length - 1 ? option.label : ""}
                  </div>
                  <div 
                    className={`w-12 h-12 flex items-center justify-center rounded-full border-2 cursor-pointer transition-all ${answers[currentQuestion.id] === option.value ? 'border-primary bg-primary/20 text-primary' : 'border-border hover:border-primary/50'}`}
                    onClick={() => handleLikertAnswer(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <span className="font-mono text-lg">{option.value}</span>
                  </div>
                  <Label htmlFor={option.value} className="md:hidden text-xs text-center cursor-pointer">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-border bg-secondary/10 pt-6">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          disabled={currentIndex === 0 || submitQuiz.isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!hasAnswer() || submitQuiz.isPending}
          className="min-w-[120px]"
        >
          {submitQuiz.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentIndex === sortedQuestions.length - 1 ? (
            "See Results"
          ) : (
            <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
