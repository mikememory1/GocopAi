import { useState } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Zap, ArrowRight, Activity, BarChart2, CheckCircle2, Target, Sparkles, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied", description: "Generation copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useGetDashboardSummary();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !summary) {
    return <div className="text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">Failed to load dashboard data.</div>;
  }

  const isNewUser = !summary.lastQuizResult && summary.totalGenerations === 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{isNewUser ? "Welcome to GoCopyAI" : "Welcome Back"}</h1>
        <p className="text-muted-foreground">{isNewUser ? "Let's get your AI marketing set up." : "Here is your intelligence overview."}</p>
      </div>

      {isNewUser && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3 mb-4">
              <BarChart2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Start with your free Marketing Audit</p>
                <p className="text-sm text-muted-foreground mt-0.5">Answer 22 quick questions and get a personalised AI action plan showing exactly what to fix in your marketing right now.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {[
                { icon: Target, text: "Benchmark your business stage" },
                { icon: Sparkles, text: "AI-generated action plan" },
                { icon: CheckCircle2, text: "Takes under 5 minutes" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/">
                <Button className="w-full sm:w-auto">
                  Take Free Marketing Audit <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/app/video">
                <Button variant="outline" className="w-full sm:w-auto">
                  Skip — Start Generating Copy
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-primary">{summary.credits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Current plan: <span className="text-foreground capitalize">{summary.currentPlan || "None"}</span></p>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold">{summary.totalGenerations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        {summary.lastQuizResult ? (
          <Card className="bg-card border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">Business Maturity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{summary.lastQuizResult.stage}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="font-mono">{summary.lastQuizResult.overallScore}/100</Badge>
                <Link href={`/app/quiz-history`} className="text-xs text-primary hover:underline flex items-center">
                  View <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Business Maturity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium text-muted-foreground mb-2">Take the quiz to find out</div>
              <Link href="/" className="text-sm text-primary hover:underline flex items-center">
                Start Quiz <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg"><Zap className="h-5 w-5 text-primary" /> Quick Tools</CardTitle>
            <CardDescription>Generate high-converting copy instantly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { href: "/app/video", label: "Video Scripts" },
              { href: "/app/ads", label: "Ad Copy" },
              { href: "/app/social", label: "Social Posts" },
              { href: "/app/blog", label: "Blog Drafts" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}>
                <div className="group cursor-pointer p-4 border border-border rounded-lg bg-secondary/50 hover:bg-secondary hover:border-primary/50 transition-all text-center">
                  <div className="font-medium group-hover:text-primary transition-colors text-sm">{label}</div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg"><Activity className="h-5 w-5 text-primary" /> Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.recentGenerations.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground border border-dashed border-border rounded-md">
                No generations yet. Try out a tool!
              </div>
            ) : (
              <div className="space-y-3">
                {summary.recentGenerations.map((gen) => (
                  <div key={gen.id} className="flex flex-col gap-1 p-3 border border-border rounded-md bg-secondary/30">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs capitalize border-primary/30 text-primary shrink-0">{gen.toolType.replace('_', ' ')}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{format(new Date(gen.createdAt), 'MMM d, h:mm a')}</span>
                      <CopyButton text={gen.inputSummary} />
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">{gen.inputSummary}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
