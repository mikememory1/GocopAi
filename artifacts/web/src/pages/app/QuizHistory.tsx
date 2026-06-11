import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListQuizResults, getListQuizResultsQueryKey, QuizResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Minus, RotateCcw, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from "recharts";
import QuizRunner from "@/components/quiz/QuizRunner";
import QuizResultsView from "@/components/quiz/QuizResultsView";

type Mode = "history" | "quiz" | "result";

export default function QuizHistory() {
  const queryClient = useQueryClient();
  const { data: results, isLoading, isError } = useListQuizResults();
  const [mode, setMode] = useState<Mode>("history");
  const [newResult, setNewResult] = useState<QuizResult | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function handleQuizComplete(result: QuizResult) {
    setNewResult(result);
    queryClient.invalidateQueries({ queryKey: getListQuizResultsQueryKey() });
    setMode("result");
  }

  function handleBackToHistory() {
    setMode("history");
    setNewResult(null);
  }

  if (mode === "quiz") {
    return (
      <div className="max-w-3xl mx-auto py-4">
        <button
          onClick={() => setMode("history")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to history
        </button>
        <div className="mb-6 text-center">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono uppercase tracking-widest text-xs mb-3">
            Retake Audit
          </Badge>
          <h1 className="text-2xl font-bold">Business Maturity Audit</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Answer honestly — we'll compare your results to previous attempts.
          </p>
        </div>
        <QuizRunner onComplete={handleQuizComplete} />
      </div>
    );
  }

  if (mode === "result" && newResult) {
    const previousResult = results?.[0];
    const delta = previousResult ? newResult.overallScore - previousResult.overallScore : null;

    return (
      <div className="max-w-3xl mx-auto py-4">
        <div className="mb-8 p-4 rounded-lg border border-border bg-card flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">New result recorded</div>
              {delta !== null && (
                <div className={`text-sm font-mono ${delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                  {delta > 0 ? `+${delta}` : delta} points vs previous attempt
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleBackToHistory}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to History
          </Button>
        </div>
        <QuizResultsView result={newResult} onDone={handleBackToHistory} />
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    return <div className="text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">Failed to load quiz history.</div>;
  }

  const sortedResults = results ? [...results].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) : [];

  const progressData = sortedResults.map((r, i) => ({
    attempt: i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `${i + 1}th`,
    score: r.overallScore,
    date: format(new Date(r.createdAt), "MMM d"),
    stage: r.stage,
  }));

  const hasMultiple = sortedResults.length >= 2;
  const latestResult = sortedResults[sortedResults.length - 1];
  const previousResult = sortedResults.length >= 2 ? sortedResults[sortedResults.length - 2] : null;
  const overallDelta = latestResult && previousResult
    ? latestResult.overallScore - previousResult.overallScore
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Quiz History</h1>
          <p className="text-muted-foreground">Track your business maturity progress over time.</p>
        </div>
        <Button onClick={() => setMode("quiz")} className="shrink-0">
          <RotateCcw className="h-4 w-4 mr-2" /> Retake Audit
        </Button>
      </div>

      {sortedResults.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-muted-foreground text-center">
              <div className="text-lg font-medium mb-1">No audit results yet</div>
              <div className="text-sm">Complete your first Business Maturity Audit to see your results here.</div>
            </div>
            <Button onClick={() => setMode("quiz")}>
              <RotateCcw className="h-4 w-4 mr-2" /> Start Audit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Latest Score</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end gap-3">
                <div className="text-4xl font-mono font-bold text-primary">
                  {latestResult?.overallScore}
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestResult?.stage}</div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {hasMultiple ? "Progress vs Last Attempt" : "Total Attempts"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasMultiple && overallDelta !== null ? (
                  <div className={`flex items-center gap-2 text-3xl font-mono font-bold ${overallDelta > 0 ? "text-green-400" : overallDelta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {overallDelta > 0 ? <TrendingUp className="h-6 w-6" /> : overallDelta < 0 ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                    {overallDelta > 0 ? `+${overallDelta}` : overallDelta}
                  </div>
                ) : (
                  <div className="text-4xl font-mono font-bold">{sortedResults.length}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress over time chart */}
          {hasMultiple && (
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Score Progress Over Time
                </CardTitle>
                <CardDescription>Overall maturity score across all your audit attempts</CardDescription>
              </CardHeader>
              <CardContent className="h-[220px] pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(val: number, _name: string, props) => [
                        `${val}/100 — ${props.payload.stage}`,
                        "Score",
                      ]}
                      labelFormatter={(label) => label}
                    />
                    <ReferenceLine
                      y={sortedResults[0]?.overallScore}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* History list — most recent first */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All Attempts</h2>
            {[...sortedResults].reverse().map((result, idx) => {
              const prevResult = sortedResults[sortedResults.length - 1 - idx - 1];
              const delta = prevResult ? result.overallScore - prevResult.overallScore : null;
              const isExpanded = expandedId === result.id;
              const isLatest = idx === 0;

              const catData = Object.entries(result.categoryScores).map(([name, value]) => ({
                name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                score: value as number,
                prev: prevResult
                  ? ((prevResult.categoryScores[name] as number) ?? null)
                  : null,
              }));

              return (
                <Card
                  key={result.id}
                  className={`bg-card transition-colors ${isLatest ? "border-primary/30" : ""}`}
                >
                  <CardContent className="p-0">
                    <button
                      className="w-full text-left p-6"
                      onClick={() => setExpandedId(isExpanded ? null : result.id)}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-lg">{result.stage}</h3>
                          <Badge variant="secondary" className="font-mono">
                            {result.overallScore}/100
                          </Badge>
                          {isLatest && (
                            <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/15 text-xs">
                              Latest
                            </Badge>
                          )}
                          {delta !== null && (
                            <span
                              className={`flex items-center gap-1 text-sm font-mono font-medium ${
                                delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"
                              }`}
                            >
                              {delta > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : delta < 0 ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : (
                                <Minus className="h-4 w-4" />
                              )}
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="text-sm">
                            {format(new Date(result.createdAt), "MMMM d, yyyy")}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
                        {/* Category scores bar chart */}
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider font-mono">
                            Category Breakdown
                          </div>
                          <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={catData}
                                layout="vertical"
                                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  horizontal={false}
                                  stroke="hsl(var(--border))"
                                />
                                <XAxis
                                  type="number"
                                  domain={[0, 100]}
                                  stroke="hsl(var(--muted-foreground))"
                                  fontSize={11}
                                  tickLine={false}
                                />
                                <YAxis
                                  dataKey="name"
                                  type="category"
                                  width={115}
                                  stroke="hsl(var(--foreground))"
                                  fontSize={11}
                                  tickLine={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                  }}
                                  formatter={(val: number, name: string, props) => {
                                    const prev = props.payload.prev;
                                    const d = prev !== null ? val - prev : null;
                                    return [
                                      `${val}/100${d !== null ? ` (${d > 0 ? "+" : ""}${d} vs prev)` : ""}`,
                                      name,
                                    ];
                                  }}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
                                  {catData.map((entry, i) => (
                                    <Cell
                                      key={`cell-${i}`}
                                      fill="hsl(var(--primary))"
                                      opacity={0.7 + (entry.score / 100) * 0.3}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Category delta badges — shown when there's a previous result */}
                        {prevResult && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-mono">
                              vs Previous Attempt
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {catData.map(({ name, score, prev }) => {
                                const d = prev !== null ? score - prev : null;
                                return (
                                  <div
                                    key={name}
                                    className="flex items-center justify-between p-2.5 rounded-md border border-border bg-secondary/30 gap-2"
                                  >
                                    <span className="text-xs font-medium truncate">{name}</span>
                                    {d !== null ? (
                                      <span
                                        className={`text-xs font-mono font-bold shrink-0 ${
                                          d > 0 ? "text-green-400" : d < 0 ? "text-red-400" : "text-muted-foreground"
                                        }`}
                                      >
                                        {d > 0 ? `+${d}` : d === 0 ? "—" : d}
                                      </span>
                                    ) : (
                                      <span className="text-xs font-mono text-muted-foreground shrink-0">{score}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Action plan */}
                        {result.generatedPlan && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-mono">
                              AI Action Plan
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed border border-border rounded-md p-4 bg-secondary/20">
                              {result.generatedPlan}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
