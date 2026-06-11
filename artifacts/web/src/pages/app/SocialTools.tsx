import { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { useGenerateContent, GenerateRequestToolType, useListBrandProfiles } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type PlatformMeta = {
  label: string;
  charLimit: string;
  hashtags: string;
  tip: string;
  color: string;
};

const PLATFORMS: Record<string, PlatformMeta> = {
  twitter: {
    label: "Twitter / X",
    charLimit: "280 chars/tweet",
    hashtags: "2-3 max",
    tip: "Threads welcome — number them 1/, 2/…",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  linkedin: {
    label: "LinkedIn",
    charLimit: "3,000 chars",
    hashtags: "3-5",
    tip: "Professional tone, end with a question",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  instagram: {
    label: "Instagram",
    charLimit: "2,200 chars (125 visible)",
    hashtags: "5-10",
    tip: "Strong visual hook, CTA to save/share",
    color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  tiktok: {
    label: "TikTok",
    charLimit: "150 char caption",
    hashtags: "3-5 trending",
    tip: "Script ≤60s, hook in first word",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  facebook: {
    label: "Facebook",
    charLimit: "40-80 words optimal",
    hashtags: "1-2 max",
    tip: "Ask a question to drive comments",
    color: "bg-blue-700/10 text-blue-400 border-blue-700/20",
  },
  pinterest: {
    label: "Pinterest",
    charLimit: "500 chars",
    hashtags: "SEO keywords",
    tip: "Inspirational, evergreen, visual language",
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

export default function SocialTools() {
  const { toast } = useToast();
  const generate = useGenerateContent();
  const { data: brandProfiles = [] } = useListBrandProfiles();

  const [output, setOutput] = useState<string | null>(null);
  const [toolType, setToolType] = useState<string>("social_post");
  const [platform, setPlatform] = useState("linkedin");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [brandProfileId, setBrandProfileId] = useState<string>("none");

  const selectedBrand = brandProfiles.find((p) => String(p.id) === brandProfileId);
  const platformMeta = PLATFORMS[platform];

  const handleGenerate = () => {
    if (!topic) {
      toast({ title: "Missing fields", description: "Please provide a topic.", variant: "destructive" });
      return;
    }

    generate.mutate({
      data: {
        toolType: toolType as GenerateRequestToolType,
        inputs: {
          platform,
          topic,
          tone,
          ...(selectedBrand ? {
            brandVoice: `Name: ${selectedBrand.name}. Tone: ${selectedBrand.tone}. ${selectedBrand.description || ""}`,
          } : {}),
        },
      },
    }, {
      onSuccess: (data) => setOutput(data.output),
      onError: (error) => toast({ title: "Generation failed", description: error.error || "An error occurred", variant: "destructive" }),
    });
  };

  return (
    <ToolLayout
      title="Social Media Content"
      description="Create platform-native posts, carousels, and content calendars — optimised for each platform's rules."
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
              <SelectItem value="social_post">Single Post / Thread</SelectItem>
              <SelectItem value="social_carousel">Carousel Outline (LinkedIn/IG)</SelectItem>
              <SelectItem value="social_calendar">30-Day Content Calendar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PLATFORMS).map(([val, meta]) => (
                <SelectItem key={val} value={val}>{meta.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {platformMeta && (
            <div className={`flex flex-wrap gap-2 mt-2 p-2.5 rounded-md border text-xs ${platformMeta.color}`}>
              <span className="font-semibold">Limit:</span> {platformMeta.charLimit}
              <span className="mx-1 opacity-40">·</span>
              <span className="font-semibold">Hashtags:</span> {platformMeta.hashtags}
              <span className="mx-1 opacity-40">·</span>
              <span className="italic">{platformMeta.tip}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>What is the post about?</Label>
            <span className={`text-xs tabular-nums ${topic.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}>
              {topic.length} chars
            </span>
          </div>
          <Textarea
            placeholder="e.g., We just crossed $1M ARR. Here are the 3 mistakes that almost killed us."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Tone of Voice</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional / Thought Leadership</SelectItem>
              <SelectItem value="casual">Casual / Conversational</SelectItem>
              <SelectItem value="contrarian">Controversial / Bold</SelectItem>
              <SelectItem value="humorous">Humorous / Witty</SelectItem>
              <SelectItem value="inspirational">Inspirational / Motivational</SelectItem>
              <SelectItem value="educational">Educational / How-To</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {brandProfiles.length > 0 && (
          <div className="space-y-2">
            <Label>Brand Voice Profile <Badge variant="outline" className="ml-2 text-[10px]">optional</Badge></Label>
            <Select value={brandProfileId} onValueChange={setBrandProfileId}>
              <SelectTrigger><SelectValue placeholder="Use default tone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No profile — use tone above</SelectItem>
                {brandProfiles.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="pt-1 text-xs text-muted-foreground border border-border rounded-md p-3 bg-secondary/20">
          <span className="font-medium text-foreground">Platform-optimised output: </span>
          The AI follows {platformMeta?.label || "your selected platform"}'s character limits, hashtag rules, and formatting conventions automatically.
        </div>
      </div>
    </ToolLayout>
  );
}
