import { useState } from "react";
import { useGenerateVariants, useSubmitFeedback } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shuffle, ThumbsUp, ThumbsDown, Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VariantsResult } from "@workspace/api-zod";

const TOOL_TYPES = [
  { value: "ads_copy", label: "Ad Copy" },
  { value: "ads_headline", label: "Ad Headlines" },
  { value: "social_post", label: "Social Post" },
  { value: "video_hook", label: "Video Hook" },
  { value: "blog_intro", label: "Blog Intro" },
  { value: "seo_meta", label: "Meta Description" },
  { value: "generic", label: "Custom Copy" },
];

const TOOL_INPUTS: Record<string, Array<{ key: string; label: string; placeholder: string; multiline?: boolean }>> = {
  ads_copy: [
    { key: "offer", label: "Product / Offer", placeholder: "e.g. Organic dog food subscription" },
    { key: "platform", label: "Platform", placeholder: "e.g. Facebook, TikTok" },
    { key: "audience", label: "Target Audience", placeholder: "e.g. dog owners aged 25–45" },
  ],
  ads_headline: [
    { key: "offer", label: "Product / Offer", placeholder: "e.g. Premium standing desk" },
    { key: "platform", label: "Platform", placeholder: "e.g. Google Ads, Meta" },
    { key: "audience", label: "Target Audience", placeholder: "e.g. remote workers" },
  ],
  social_post: [
    { key: "topic", label: "Topic", placeholder: "e.g. Our new collection just dropped" },
    { key: "platform", label: "Platform", placeholder: "e.g. Instagram, LinkedIn" },
    { key: "tone", label: "Tone", placeholder: "e.g. excited, professional, casual" },
  ],
  video_hook: [
    { key: "topic", label: "Video Topic", placeholder: "e.g. 5 ways to grow on TikTok" },
    { key: "audience", label: "Target Viewer", placeholder: "e.g. small business owners" },
  ],
  blog_intro: [
    { key: "topic", label: "Blog Topic", placeholder: "e.g. How to start a Shopify store" },
    { key: "audience", label: "Target Reader", placeholder: "e.g. first-time ecommerce entrepreneurs" },
  ],
  seo_meta: [
    { key: "keyword", label: "Target Keyword", placeholder: "e.g. best running shoes for flat feet" },
    { key: "topic", label: "Page Topic", placeholder: "e.g. product category page" },
  ],
  generic: [
    { key: "prompt", label: "What do you want to write?", placeholder: "Describe the copy you need...", multiline: true },
    { key: "tone", label: "Tone / Style", placeholder: "e.g. professional, bold, funny" },
  ],
};

export default function ABVariants() {
  const { toast } = useToast();
  const generateVariants = useGenerateVariants();
  const submitFeedback = useSubmitFeedback();

  const [toolType, setToolType] = useState("ads_copy");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [variantCount, setVariantCount] = useState(3);
  const [result, setResult] = useState<VariantsResult | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<number, "liked" | "disliked">>({});

  const currentFields = TOOL_INPUTS[toolType] ?? TOOL_INPUTS.generic;

  function handleGenerate() {
    const missing = currentFields.filter(f => !f.multiline && !inputs[f.key]?.trim());
    if (!inputs[currentFields[0]?.key ?? ""]?.trim()) {
      toast({ title: "Fill in at least the first field", variant: "destructive" }); return;
    }

    generateVariants.mutate({
      data: { toolType, inputs, count: variantCount }
    }, {
      onSuccess: (data) => {
        setResult(data);
        setRatings({});
        toast({ title: `${data.variants.length} variants generated`, description: `${data.creditsUsed} credits used` });
      },
      onError: (err: unknown) => {
        const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Generation failed";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    });
  }

  function handleRate(variantId: number, genId: number, rating: "liked" | "disliked") {
    setRatings(prev => ({ ...prev, [variantId]: rating }));
    submitFeedback.mutate({
      data: { generationId: genId, rating }
    }, {
      onSuccess: () => toast({ title: rating === "liked" ? "Marked as winner ✓" : "Feedback saved" }),
    });
  }

  function handleCopy(text: string, id: number) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">A/B Variant Generator</h1>
        <p className="text-muted-foreground">Generate 2–5 different versions of any copy using different angles. Rate winners to help the AI learn your preferences.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Generate Variants</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={toolType} onValueChange={v => { setToolType(v); setInputs({}); setResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TOOL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of variants: <span className="text-primary font-semibold">{variantCount}</span></Label>
              <input type="range" min={2} max={5} value={variantCount} onChange={e => setVariantCount(Number(e.target.value))} className="w-full mt-3" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>2</span><span>5</span></div>
            </div>
          </div>

          {currentFields.map(field => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              {field.multiline ? (
                <Textarea
                  value={inputs[field.key] ?? ""}
                  onChange={e => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  value={inputs[field.key] ?? ""}
                  onChange={e => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

          <Button onClick={handleGenerate} disabled={generateVariants.isPending} className="w-full gap-2">
            {generateVariants.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
            {generateVariants.isPending ? `Generating ${variantCount} variants…` : `Generate ${variantCount} Variants`}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{result.variants.length} Variants</h2>
            <p className="text-sm text-muted-foreground">{result.creditsUsed} credits used · Rate variants to train your AI preferences</p>
          </div>

          <div className="grid gap-4">
            {result.variants.map((variant, idx) => {
              const isLiked = ratings[variant.id] === "liked";
              const isDisliked = ratings[variant.id] === "disliked";
              return (
                <Card key={variant.id} className={`transition-all ${isLiked ? "border-green-500/50 bg-green-500/5" : isDisliked ? "border-red-500/30 opacity-60" : "hover:border-primary/30"}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">V{idx + 1}</Badge>
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">{variant.angle}</Badge>
                        {isLiked && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Winner</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(variant.output, variant.id)}
                        >
                          {copiedId === variant.id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${isLiked ? "text-green-400 bg-green-500/10" : ""}`}
                          onClick={() => handleRate(variant.id, variant.id, "liked")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${isDisliked ? "text-red-400 bg-red-500/10" : ""}`}
                          onClick={() => handleRate(variant.id, variant.id, "disliked")}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{variant.output}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button variant="outline" onClick={() => { setResult(null); setInputs({}); }} className="w-full">Generate New Variants</Button>
        </div>
      )}
    </div>
  );
}
