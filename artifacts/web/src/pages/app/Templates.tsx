import { useState } from "react";
import { useListTemplates, useGenerateContent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, BookOpen, Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ContentTemplate } from "@workspace/api-zod";

const CATEGORY_LABELS: Record<string, string> = {
  ads: "Ads",
  social: "Social Media",
  seo: "SEO & Blog",
  video: "Video",
  email: "Email",
  blog: "Blog",
};

const CATEGORY_COLORS: Record<string, string> = {
  ads: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  social: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  seo: "bg-green-500/20 text-green-400 border-green-500/30",
  video: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  email: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  blog: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const ALL_CATEGORIES = ["all", "ads", "social", "seo", "video", "email", "blog"];

export default function Templates() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: templates = [], isLoading } = useListTemplates({
    params: activeCategory !== "all" ? { category: activeCategory } : {},
  });

  const generate = useGenerateContent();

  const filtered = templates.filter(t =>
    searchQuery === "" ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.framework.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function openTemplate(t: ContentTemplate) {
    setSelectedTemplate(t);
    setFieldValues(Object.fromEntries(t.fields.map(f => [f.key, ""])));
    setOutput("");
  }

  function buildPrompt(template: ContentTemplate, values: Record<string, string>): string {
    let prompt = template.prompt;
    for (const [key, value] of Object.entries(values)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value || `[${key}]`);
    }
    return prompt;
  }

  function handleGenerate() {
    if (!selectedTemplate) return;
    const missingRequired = selectedTemplate.fields.filter(f => !fieldValues[f.key]?.trim());
    if (missingRequired.length > 0) {
      toast({ title: `Fill in: ${missingRequired.map(f => f.label).join(", ")}`, variant: "destructive" });
      return;
    }

    const prompt = buildPrompt(selectedTemplate, fieldValues);
    generate.mutate({
      data: {
        toolType: "generic",
        inputs: { prompt, useCase: `${selectedTemplate.framework} template — ${selectedTemplate.name}` },
      }
    }, {
      onSuccess: (data) => {
        setOutput(data.output);
        toast({ title: "Generated!", description: `${data.creditsUsed} credits used` });
      },
      onError: () => toast({ title: "Generation failed", variant: "destructive" }),
    });
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Template Library</h1>
        <p className="text-muted-foreground">Proven copy frameworks. Pick a template, fill in your details, and generate professional copy in seconds.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
            >
              {cat === "all" ? "All Templates" : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(template => (
          <Card
            key={template.id}
            className="cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
            onClick={() => openTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">{template.name}</CardTitle>
                <Badge className={`text-xs border shrink-0 ${CATEGORY_COLORS[template.category] ?? "bg-secondary"}`}>
                  {CATEGORY_LABELS[template.category] ?? template.category}
                </Badge>
              </div>
              <Badge variant="outline" className="w-fit text-xs mt-1">{template.framework}</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm line-clamp-3">{template.description}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-3">
                {template.fields.map(f => (
                  <span key={f.key} className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">{f.label}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No templates found for "{searchQuery}"</p>
        </div>
      )}

      <Dialog open={selectedTemplate !== null} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        {selectedTemplate && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                {selectedTemplate.name}
                <Badge className={`text-xs border ${CATEGORY_COLORS[selectedTemplate.category] ?? "bg-secondary"}`}>
                  {CATEGORY_LABELS[selectedTemplate.category] ?? selectedTemplate.category}
                </Badge>
                <Badge variant="outline" className="text-xs">{selectedTemplate.framework}</Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">{selectedTemplate.description}</p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {selectedTemplate.fields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    value={fieldValues[field.key] ?? ""}
                    onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}

              <Button onClick={handleGenerate} disabled={generate.isPending} className="w-full gap-2">
                {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generate.isPending ? "Generating..." : "Generate Copy (1–2 credits)"}
              </Button>

              {output && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Generated Output</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="p-4 bg-secondary/40 rounded-lg text-sm whitespace-pre-wrap font-mono leading-relaxed border border-border">
                    {output}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Close</Button>
              {output && (
                <Button variant="outline" onClick={() => { setOutput(""); setFieldValues(Object.fromEntries(selectedTemplate.fields.map(f => [f.key, ""]))); }}>
                  Reset
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
