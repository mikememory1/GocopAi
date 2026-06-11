import { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { useGenerateContent, GenerateRequestToolType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function BlogTools() {
  const { toast } = useToast();
  const generate = useGenerateContent();
  const [output, setOutput] = useState<string | null>(null);
  
  const [toolType, setToolType] = useState<string>("blog_draft");
  const [topic, setTopic] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState("educational");

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
          keyPoints,
          tone
        }
      }
    }, {
      onSuccess: (data) => setOutput(data.output),
      onError: (error) => toast({ title: "Generation failed", description: error.error || "An error occurred", variant: "destructive" })
    });
  };

  return (
    <ToolLayout
      title="Long-form Content"
      description="Draft blog posts, compelling intros, and strong conclusions."
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
              <SelectItem value="blog_draft">Full Blog Draft (~1000 words)</SelectItem>
              <SelectItem value="blog_intro">Hook / Intro Variations</SelectItem>
              <SelectItem value="blog_conclusion">Conclusion & CTA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Topic / Title</Label>
          <Input 
            placeholder="e.g., The Ultimate Guide to B2B Cold Email in 2024" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Key Points to Cover</Label>
          <Textarea 
            placeholder="- Personalization over volume&#10;- Relevance vs research&#10;- Call to action frameworks" 
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="educational">Educational & Authoritative</SelectItem>
              <SelectItem value="conversational">Conversational & Approachable</SelectItem>
              <SelectItem value="data_driven">Data-driven & Analytical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </ToolLayout>
  );
}
