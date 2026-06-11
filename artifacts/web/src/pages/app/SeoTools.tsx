import { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { useGenerateContent, GenerateRequestToolType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SeoTools() {
  const { toast } = useToast();
  const generate = useGenerateContent();
  const [output, setOutput] = useState<string | null>(null);
  
  const [toolType, setToolType] = useState<string>("seo_outline");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [competitors, setCompetitors] = useState("");

  const handleGenerate = () => {
    if (!topic) {
      toast({ title: "Missing fields", description: "Please provide a topic.", variant: "destructive" });
      return;
    }

    generate.mutate({
      data: {
        toolType: toolType as GenerateRequestToolType,
        inputs: {
          topic,
          keywords,
          competitors
        }
      }
    }, {
      onSuccess: (data) => setOutput(data.output),
      onError: (error) => toast({ title: "Generation failed", description: error.error || "An error occurred", variant: "destructive" })
    });
  };

  return (
    <ToolLayout
      title="SEO Optimization"
      description="Generate blog outlines, meta descriptions, and keyword clusters optimized for search."
      output={output}
      isLoading={generate.isPending}
      onGenerate={handleGenerate}
      disabled={!topic}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Generation Type</Label>
          <Select value={toolType} onValueChange={setToolType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seo_outline">Blog Outline</SelectItem>
              <SelectItem value="seo_meta">Title & Meta Description</SelectItem>
              <SelectItem value="seo_keywords">Keyword Clusters</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Primary Topic</Label>
          <Textarea 
            placeholder="e.g., Best CRM software for small businesses" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Target Keywords (Comma separated)</Label>
          <Input 
            placeholder="e.g., CRM for startups, small business CRM, CRM software" 
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Competitor URLs (Optional)</Label>
          <Textarea 
            placeholder="e.g., hubspot.com/small-business-crm" 
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>
      </div>
    </ToolLayout>
  );
}
