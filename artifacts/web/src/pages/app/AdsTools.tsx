import { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { useGenerateContent, GenerateRequestToolType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdsTools() {
  const { toast } = useToast();
  const generate = useGenerateContent();
  const [output, setOutput] = useState<string | null>(null);
  
  const [toolType, setToolType] = useState<string>("ads_copy");
  const [platform, setPlatform] = useState("facebook");
  const [product, setProduct] = useState("");
  const [offer, setOffer] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const handleGenerate = () => {
    if (!product) {
      toast({ title: "Missing fields", description: "Please provide a product description.", variant: "destructive" });
      return;
    }

    generate.mutate({
      data: {
        toolType: toolType as GenerateRequestToolType,
        inputs: {
          platform,
          product,
          offer,
          targetAudience
        }
      }
    }, {
      onSuccess: (data) => setOutput(data.output),
      onError: (error) => toast({ title: "Generation failed", description: error.error || "An error occurred", variant: "destructive" })
    });
  };

  return (
    <ToolLayout
      title="Performance Ads"
      description="Generate high-converting ad copy, headlines, and angles for paid campaigns."
      output={output}
      isLoading={generate.isPending}
      onGenerate={handleGenerate}
      disabled={!product}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Generation Type</Label>
          <Select value={toolType} onValueChange={setToolType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ads_copy">Full Ad Copy (Primary Text, Headline, Description)</SelectItem>
              <SelectItem value="ads_headline">10 Headline Variations</SelectItem>
              <SelectItem value="ads_angle">5 New Marketing Angles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="facebook">Facebook / Instagram</SelectItem>
              <SelectItem value="google">Google Search</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product/Service Description</Label>
          <Textarea 
            placeholder="e.g., An AI-powered email assistant that drafts replies in your tone of voice." 
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Offer / CTA</Label>
          <Input 
            placeholder="e.g., Start your 14-day free trial, no credit card required" 
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Input 
            placeholder="e.g., Busy founders, executives receiving 100+ emails/day" 
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>
      </div>
    </ToolLayout>
  );
}
