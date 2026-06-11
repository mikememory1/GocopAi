import { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { useGenerateContent, GenerateRequestToolType } from "@workspace/api-client-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function GenericTool() {
  const { toast } = useToast();
  const generate = useGenerateContent();
  const [output, setOutput] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gpt-4o");

  const handleGenerate = () => {
    if (!prompt) {
      toast({ title: "Missing prompt", description: "Please enter a prompt.", variant: "destructive" });
      return;
    }

    generate.mutate({
      data: {
        toolType: "generic" as GenerateRequestToolType,
        inputs: {
          prompt
        },
        model
      }
    }, {
      onSuccess: (data) => setOutput(data.output),
      onError: (error) => toast({ title: "Generation failed", description: error.error || "An error occurred", variant: "destructive" })
    });
  };

  return (
    <ToolLayout
      title="Generic Sandbox"
      description="Direct access to language models for custom marketing requests."
      output={output}
      isLoading={generate.isPending}
      onGenerate={handleGenerate}
      disabled={!prompt}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prompt</Label>
          <Textarea 
            placeholder="Write a custom prompt here..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="resize-none font-mono text-sm"
          />
        </div>
      </div>
    </ToolLayout>
  );
}
