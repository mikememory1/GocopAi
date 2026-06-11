import { QuizResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Show } from "@clerk/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function QuizResultsView({ result, onDone }: { result: QuizResult; onDone?: () => void }) {
  const chartData = Object.entries(result.categoryScores).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: value
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="text-center space-y-4 mb-12">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm py-1 px-4 uppercase tracking-widest font-mono">
          Analysis Complete
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Your Business Maturity is <span className="text-primary">{result.stage}</span></h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          You scored <span className="font-mono text-foreground font-bold">{result.overallScore}/100</span> overall.
          Here is your precise breakdown and action plan.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--foreground))" fontSize={12} fontWeight="medium" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={0.8 + (entry.score / 100) * 0.2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20 shadow-[0_0_30px_-15px_hsl(var(--primary))]">
          <CardHeader className="border-b border-border bg-secondary/10">
            <CardTitle className="flex items-center gap-2">
              Action Plan 
              <Badge className="bg-primary/20 text-primary hover:bg-primary/20">AI Generated</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {result.generatedPlan || "Your action plan is being generated. Please check your dashboard later."}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8 pb-16">
        <Show when="signed-out">
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-6 h-auto shadow-[0_0_20px_-5px_hsl(var(--primary))]">
              Create Free Account to Save Results
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4 sm:hidden">Already have an account? <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link></p>
        </Show>
        
        <Show when="signed-in">
          {onDone ? (
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto shadow-[0_0_20px_-5px_hsl(var(--primary))]"
              onClick={onDone}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Link href="/app">
              <Button size="lg" className="text-lg px-8 py-6 h-auto shadow-[0_0_20px_-5px_hsl(var(--primary))]">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </Show>
      </div>
    </div>
  );
}
