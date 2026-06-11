import { useState } from "react";
import { useAnalyseCompetitor } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, TrendingUp, AlertTriangle, Lightbulb, Swords, Megaphone, FileText, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CompetitorAnalyseResult } from "@workspace/api-zod";

export default function CompetitorAnalysis() {
  const { toast } = useToast();
  const analyse = useAnalyseCompetitor();

  const [form, setForm] = useState({ competitorUrl: "", yourProduct: "", yourAudience: "" });
  const [result, setResult] = useState<CompetitorAnalyseResult | null>(null);

  function handleAnalyse() {
    if (!form.competitorUrl.trim()) { toast({ title: "Competitor URL required", variant: "destructive" }); return; }
    analyse.mutate({
      data: {
        competitorUrl: form.competitorUrl,
        yourProduct: form.yourProduct || null,
        yourAudience: form.yourAudience || null,
      }
    }, {
      onSuccess: (data) => {
        setResult(data);
        toast({ title: "Analysis complete", description: `${data.creditsUsed} credits used` });
      },
      onError: (err: unknown) => {
        const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Analysis failed";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Competitor Analysis</h1>
        <p className="text-muted-foreground">Enter a competitor's URL. AI analyses their strategy and builds your counter-playbook — ad angles, content ideas, and positioning advice.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Analyse a Competitor</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Competitor URL *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={form.competitorUrl}
                  onChange={e => setForm(f => ({ ...f, competitorUrl: e.target.value }))}
                  placeholder="https://competitor.com"
                  onKeyDown={e => e.key === "Enter" && handleAnalyse()}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your product (optional)</Label>
              <Input value={form.yourProduct} onChange={e => setForm(f => ({ ...f, yourProduct: e.target.value }))} placeholder="e.g. Eco dog toys for large breeds" />
            </div>
            <div className="space-y-2">
              <Label>Your target audience (optional)</Label>
              <Input value={form.yourAudience} onChange={e => setForm(f => ({ ...f, yourAudience: e.target.value }))} placeholder="e.g. eco-conscious dog owners 25–45" />
            </div>
          </div>
          <Button onClick={handleAnalyse} disabled={analyse.isPending} className="gap-2 w-full sm:w-auto">
            {analyse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {analyse.isPending ? "Analysing competitor…" : "Analyse Competitor (5 credits)"}
          </Button>
        </CardContent>
      </Card>

      {analyse.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analysing their strategy…</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-5">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Globe className="h-5 w-5 text-primary" />Summary</CardTitle>
            </CardHeader>
            <CardContent><p className="text-muted-foreground leading-relaxed">{result.summary}</p></CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-green-400"><TrendingUp className="h-4 w-4" />Their Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm"><span className="text-green-400 font-bold mt-0.5">+</span>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-400"><AlertTriangle className="h-4 w-4" />Their Weaknesses</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2 text-sm"><span className="text-red-400 font-bold mt-0.5">−</span>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-blue-400"><Lightbulb className="h-4 w-4" />Your Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.opportunities.map((o, i) => (
                    <li key={i} className="flex gap-2 text-sm"><span className="text-blue-400 font-bold mt-0.5">→</span>{o}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Swords className="h-5 w-5 text-yellow-400" />Counter-Strategy</CardTitle>
            </CardHeader>
            <CardContent><p className="text-muted-foreground leading-relaxed">{result.counterStrategy}</p></CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5 text-primary" />Ad Angles to Use Against Them</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.adAngles.map((a, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                      <Badge variant="outline" className="shrink-0 text-xs">{i + 1}</Badge>
                      {a}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-primary" />Content Ideas They're Missing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.contentIdeas.map((idea, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                      <Badge variant="outline" className="shrink-0 text-xs">{i + 1}</Badge>
                      {idea}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Button variant="outline" onClick={() => setResult(null)} className="w-full">Analyse Another Competitor</Button>
        </div>
      )}
    </div>
  );
}
