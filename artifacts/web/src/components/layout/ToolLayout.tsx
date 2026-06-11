import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  output: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  submitText?: string;
  disabled?: boolean;
  outputLabel?: string;
  outputFooter?: ReactNode;
}

export default function ToolLayout({ 
  title, 
  description, 
  children, 
  output, 
  isLoading, 
  onGenerate,
  submitText = "Generate Content",
  disabled = false,
  outputLabel = "Output",
  outputFooter,
}: ToolLayoutProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const inputCardRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: "Content has been copied to your clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const safeGenerate = useCallback(() => {
    if (!isLoading && !disabled) onGenerate();
  }, [isLoading, disabled, onGenerate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const first = inputCardRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), textarea, select"
      );
      first?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        safeGenerate();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [safeGenerate]);

  const wordCount = output ? output.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = output ? output.length : 0;

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto md:h-[calc(100vh-8rem)]">
      {/* Left side - Inputs */}
      <Card ref={inputCardRef} className="flex flex-col border-border bg-card overflow-hidden md:flex-1">
        <div className="p-4 md:p-6 border-b border-border bg-secondary/20">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        
        <ScrollArea className="md:flex-1 p-4 md:p-6">
          <div className="space-y-5">
            {children}
            
            <div>
              <Button 
                onClick={onGenerate} 
                disabled={isLoading || disabled} 
                className="w-full font-bold shadow-[0_0_20px_-5px_hsl(var(--primary))]"
                size="lg"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? "Generating..." : submitText}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground/50 mt-2">
                {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+Enter to generate
              </p>
            </div>
          </div>
        </ScrollArea>
      </Card>

      {/* Right side - Output */}
      <Card className="flex flex-col border-border bg-card overflow-hidden md:flex-1 min-h-[300px]">
        <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">{outputLabel}</h2>
          <div className="flex items-center gap-2">
            {output && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={safeGenerate}
                className="h-8 text-muted-foreground hover:text-foreground"
                title="Regenerate with same inputs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              disabled={!output || isLoading}
              className="h-8"
            >
              {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1 bg-secondary/10 p-4 md:p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="animate-pulse">Generating your professional copy...</p>
            </div>
          ) : output ? (
            <div>
              <div className="text-foreground">{output}</div>
              {outputFooter}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground text-sm">
              Your generated content will appear here.
            </div>
          )}
        </ScrollArea>

        {output && !isLoading && (
          <div className="px-4 py-2 border-t border-border bg-secondary/10 flex items-center gap-3 text-[11px] text-muted-foreground/60 font-mono">
            <span>{wordCount} words</span>
            <span className="opacity-40">·</span>
            <span>{charCount.toLocaleString()} chars</span>
          </div>
        )}
      </Card>
    </div>
  );
}
