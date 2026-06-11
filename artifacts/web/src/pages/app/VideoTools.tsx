import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import {
  useGenerateContent,
  GenerateRequestToolType,
  useVideoVoiceover,
  useVideoTalkingHead,
  useVideoBroll,
  useGetVideoJob,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ExternalLink,
  Info,
  Mic,
  Video,
  Film,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

// ─── Provider definitions ────────────────────────────────────────────────────

const VOICEOVER_PROVIDERS = [
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    badge: "Best quality",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    desc: "Ultra-realistic AI voices with emotional range. Industry standard for marketing content.",
    envKey: "ELEVENLABS_API_KEY",
    signupUrl: "https://elevenlabs.io",
    costNote: "5 credits",
    voices: [
      { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel — professional, clear" },
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella — friendly, warm" },
      { id: "VR6AewLTigWG4xSOukaG", name: "Arnold — authoritative" },
      { id: "pNInz6obpgDQGcFmaJgB", name: "Adam — deep, confident" },
      { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam — energetic" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI TTS HD",
    badge: "Uses existing key",
    badgeColor: "bg-green-500/20 text-green-300 border-green-500/30",
    desc: "High-definition text-to-speech from OpenAI. Uses your existing OpenAI API key — no extra signup.",
    envKey: "OPENAI_API_KEY",
    signupUrl: null,
    costNote: "5 credits",
    voices: [
      { id: "alloy", name: "Alloy — neutral, versatile" },
      { id: "echo", name: "Echo — male, clear" },
      { id: "fable", name: "Fable — expressive, British" },
      { id: "onyx", name: "Onyx — deep, authoritative" },
      { id: "nova", name: "Nova — female, friendly" },
      { id: "shimmer", name: "Shimmer — female, soft" },
    ],
  },
];

const TALKING_HEAD_PROVIDERS = [
  {
    id: "did",
    label: "D-ID",
    badge: "Proven",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    desc: "Turn any photo into a talking presenter. Great for product explainers and spokesperson videos.",
    envKey: "DID_API_KEY",
    signupUrl: "https://studio.d-id.com",
    costNote: "10 credits • ~2–3 min",
  },
  {
    id: "heygen",
    label: "HeyGen",
    badge: "Most realistic",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    desc: "Studio-quality AI avatars with lip-sync. Best-in-class realism for professional brand videos.",
    envKey: "HEYGEN_API_KEY",
    signupUrl: "https://app.heygen.com",
    costNote: "10 credits • ~3–5 min",
  },
];

const BROLL_PROVIDERS = [
  {
    id: "runway_gen3",
    label: "Runway Gen-3 Alpha Turbo",
    badge: "Fast",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    desc: "Fast, reliable b-roll generation. Great for quick turnarounds on social content.",
    envKey: "RUNWAY_API_KEY",
    signupUrl: "https://app.runwayml.com",
    costNote: "15 credits • ~3–5 min per clip",
  },
  {
    id: "runway_gen4",
    label: "Runway Gen-4 Turbo",
    badge: "Highest quality",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    desc: "Runway's latest model — sharper motion, better coherence, cinematic quality. Same API key.",
    envKey: "RUNWAY_API_KEY",
    signupUrl: "https://app.runwayml.com",
    costNote: "15 credits • ~4–6 min per clip",
  },
  {
    id: "luma",
    label: "Luma Dream Machine",
    badge: "Hyper-realistic",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    desc: "Photorealistic motion — exceptional for product demos, food/beauty shots, lifestyle footage.",
    envKey: "LUMAAI_API_KEY",
    signupUrl: "https://lumalabs.ai/dream-machine/api",
    costNote: "15 credits • ~3–5 min per clip",
  },
];

// ─── Free fallback tools ──────────────────────────────────────────────────────

const FREE_TOOLS = [
  { name: "CapCut", desc: "Auto-captions, voiceover & templates", url: "https://www.capcut.com", badge: "Most popular", color: "bg-purple-500/20 text-purple-300" },
  { name: "VEED.IO", desc: "Text-to-video + subtitles", url: "https://www.veed.io", badge: "Free tier", color: "bg-green-500/20 text-green-300" },
  { name: "InVideo", desc: "Script-to-video automation", url: "https://invideo.io", badge: "Free tier", color: "bg-green-500/20 text-green-300" },
];

// ─── Job poller ───────────────────────────────────────────────────────────────

function JobPoller({ jobId, onComplete }: { jobId: number; onComplete: (url: string | null) => void }) {
  const { data } = useGetVideoJob(jobId, {
    query: {
      refetchInterval: (query) => {
        const s = (query.state.data as { status?: string } | undefined)?.status;
        return s === "processing" || s === "pending" ? 4000 : false;
      },
    },
  });

  useEffect(() => {
    if (data?.status === "completed" || data?.status === "failed") {
      onComplete(data.outputUrl ?? null);
    }
  }, [data?.status, data?.outputUrl, onComplete]);

  const s = data?.status;
  if (!s || s === "processing" || s === "pending") {
    return <span className="flex items-center gap-1.5 text-xs text-amber-400"><Loader2 className="w-3 h-3 animate-spin" /> Processing…</span>;
  }
  if (s === "completed") return <span className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle2 className="w-3 h-3" /> Ready</span>;
  return <span className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle className="w-3 h-3" /> Failed</span>;
}

// ─── Provider selector card ───────────────────────────────────────────────────

function ProviderCard({ providers, selected, onSelect }: {
  providers: typeof VOICEOVER_PROVIDERS;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {providers.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
            selected === p.id
              ? "border-purple-500/50 bg-purple-500/10"
              : "border-border bg-muted/10 hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{p.label}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${p.badgeColor}`}>{p.badge}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{p.costNote}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
          {p.signupUrl && (
            <a
              href={p.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="w-2.5 h-2.5" /> {p.signupUrl.replace("https://", "")}
            </a>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Pipeline component ───────────────────────────────────────────────────────

function VideoPipeline({ script }: { script: string }) {
  const { toast } = useToast();
  const voiceoverMutation = useVideoVoiceover();
  const talkingHeadMutation = useVideoTalkingHead();
  const brollMutation = useVideoBroll();

  const [voiceProvider, setVoiceProvider] = useState("elevenlabs");
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [headProvider, setHeadProvider] = useState("did");
  const [brollProvider, setBrollProvider] = useState("runway_gen3");

  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [talkingHeadJob, setTalkingHeadJob] = useState<{ jobId: number } | null>(null);
  const [talkingHeadUrl, setTalkingHeadUrl] = useState<string | null>(null);
  const [brollJobs, setBrollJobs] = useState<Array<{ jobId: number; scene: string }>>([]);
  const [brollResults, setBrollResults] = useState<Record<number, string | null>>({});

  const selectedVoiceProvider = VOICEOVER_PROVIDERS.find((p) => p.id === voiceProvider)!;

  const handleVoiceover = () => {
    voiceoverMutation.mutate(
      { data: { text: script, provider: voiceProvider as "elevenlabs" | "openai", voiceId } },
      {
        onSuccess: (data) => {
          setAudioBase64(data.audioBase64);
          toast({ title: "Voiceover ready", description: `~${data.durationEstimate}s • ${data.creditsUsed} credits used` });
        },
        onError: (err) => toast({ title: "Voiceover failed", description: err.error || "An error occurred", variant: "destructive" }),
      },
    );
  };

  const handleTalkingHead = () => {
    talkingHeadMutation.mutate(
      { data: { script, provider: headProvider as "did" | "heygen" } },
      {
        onSuccess: (data) => {
          setTalkingHeadJob({ jobId: data.jobId });
          toast({ title: "Talking head queued", description: `${data.creditsUsed} credits used • check back in a few minutes` });
        },
        onError: (err) => toast({ title: "Talking head failed", description: err.error || "An error occurred", variant: "destructive" }),
      },
    );
  };

  const handleBroll = () => {
    brollMutation.mutate(
      { data: { script, provider: brollProvider as "runway_gen3" | "runway_gen4" | "luma" } },
      {
        onSuccess: (data) => {
          setBrollJobs(data.jobs.map((j) => ({ jobId: j.jobId, scene: j.scene })));
          toast({ title: "B-roll clips queued", description: `${data.jobs.length} scenes • ${data.creditsUsed} credits used` });
        },
        onError: (err) => toast({ title: "B-roll failed", description: err.error || "An error occurred", variant: "destructive" }),
      },
    );
  };

  const onBrollComplete = useCallback((jobId: number, url: string | null) => {
    setBrollResults((prev) => ({ ...prev, [jobId]: url }));
  }, []);

  const audioDataUrl = audioBase64 ? `data:audio/mpeg;base64,${audioBase64}` : null;
  const doneCount = Object.keys(brollResults).length;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-foreground">AI Video Production Pipeline</h3>
        <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">Beta</Badge>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-blue-300">How to use this pipeline</p>
        <ol className="text-xs text-blue-200/80 space-y-1 list-decimal list-inside leading-relaxed">
          <li>Choose your preferred AI model for each step below</li>
          <li>Click <strong>Generate</strong> — each step is independent, run them in any order</li>
          <li>Results appear inline — download audio and video clips directly</li>
          <li>Combine clips in <strong>CapCut</strong> or <strong>DaVinci Resolve</strong> to finish your video</li>
        </ol>
        <p className="text-[10px] text-blue-300/60 pt-1">
          Each model uses your API key for that platform. Sign up links are shown on each provider card.
        </p>
      </div>

      {/* ── Step 1 — Voiceover ── */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Mic className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Step 1 — Voiceover</p>
            <p className="text-xs text-muted-foreground">Converts your script to spoken audio</p>
          </div>
        </div>

        <ProviderCard
          providers={VOICEOVER_PROVIDERS}
          selected={voiceProvider}
          onSelect={(id) => {
            setVoiceProvider(id);
            const p = VOICEOVER_PROVIDERS.find((x) => x.id === id)!;
            setVoiceId(p.voices[0]!.id);
          }}
        />

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Voice</Label>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedVoiceProvider.voices.map((v) => (
                <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          {audioDataUrl ? (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Done
            </Badge>
          ) : <div />}
          <Button
            size="sm"
            onClick={handleVoiceover}
            disabled={voiceoverMutation.isPending}
            className="h-7 text-xs"
          >
            {voiceoverMutation.isPending
              ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating…</>
              : audioDataUrl ? "Regenerate" : "Generate Voiceover"}
          </Button>
        </div>

        {audioDataUrl && (
          <div className="rounded-md border border-border bg-background p-2">
            <audio controls src={audioDataUrl} className="w-full h-8" />
            <p className="text-[10px] text-muted-foreground mt-1.5">Right-click → Save to download the MP3</p>
          </div>
        )}
      </div>

      {/* ── Step 2 — Talking Head ── */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
            <Video className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Step 2 — Talking Head Presenter</p>
            <p className="text-xs text-muted-foreground">AI avatar reads your script on camera</p>
          </div>
        </div>

        <ProviderCard
          providers={TALKING_HEAD_PROVIDERS}
          selected={headProvider}
          onSelect={setHeadProvider}
        />

        <div className="flex items-center justify-between">
          {talkingHeadUrl ? (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Done
            </Badge>
          ) : talkingHeadJob ? (
            <JobPoller jobId={talkingHeadJob.jobId} onComplete={setTalkingHeadUrl} />
          ) : <div />}
          <Button
            size="sm"
            onClick={handleTalkingHead}
            disabled={talkingHeadMutation.isPending || !!talkingHeadJob}
            className="h-7 text-xs"
          >
            {talkingHeadMutation.isPending
              ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Starting…</>
              : talkingHeadJob ? "Queued" : "Create Talking Head"}
          </Button>
        </div>

        {talkingHeadUrl && (
          <div className="rounded-md overflow-hidden border border-border">
            <video src={talkingHeadUrl} controls className="w-full max-h-64 bg-black" playsInline />
            <div className="flex justify-end p-2 bg-muted/30">
              <a href={talkingHeadUrl} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Download video
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Step 3 — B-roll ── */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <Film className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Step 3 — B-roll Clips</p>
            <p className="text-xs text-muted-foreground">3 AI-generated video scenes from your script</p>
          </div>
        </div>

        <ProviderCard
          providers={BROLL_PROVIDERS}
          selected={brollProvider}
          onSelect={setBrollProvider}
        />

        <div className="flex items-center justify-between">
          {brollJobs.length > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              {doneCount}/{brollJobs.length} clips ready
            </Badge>
          ) : <div />}
          <Button
            size="sm"
            onClick={handleBroll}
            disabled={brollMutation.isPending || brollJobs.length > 0}
            className="h-7 text-xs"
          >
            {brollMutation.isPending
              ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Starting…</>
              : brollJobs.length > 0 ? "Generating…" : "Generate B-roll"}
          </Button>
        </div>

        {brollJobs.length > 0 && (
          <div className="space-y-2">
            {brollJobs.map((job) => {
              const url = brollResults[job.jobId];
              return (
                <div key={job.jobId} className="rounded-md border border-border bg-background p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{job.scene}</p>
                    {url !== undefined ? (
                      url
                        ? <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Ready</Badge>
                        : <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] shrink-0"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>
                    ) : (
                      <JobPoller jobId={job.jobId} onComplete={(u) => onBrollComplete(job.jobId, u)} />
                    )}
                  </div>
                  {url && (
                    <div className="rounded overflow-hidden border border-border">
                      <video src={url} controls loop className="w-full max-h-40 bg-black" playsInline />
                      <div className="flex justify-end p-1.5 bg-muted/30">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Download clip
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VideoTools() {
  const { toast } = useToast();
  const generate = useGenerateContent();
  const [output, setOutput] = useState<string | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [toolType, setToolType] = useState<string>("video_script");
  const [platform, setPlatform] = useState("youtube");
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("educational");
  const [duration, setDuration] = useState("3_minutes");

  const handleGenerate = () => {
    if (!topic) {
      toast({ title: "Missing fields", description: "Please provide a topic.", variant: "destructive" });
      return;
    }
    generate.mutate(
      { data: { toolType: toolType as GenerateRequestToolType, inputs: { topic, targetAudience, tone, duration, platform } } },
      {
        onSuccess: (data) => { setOutput(data.output); setShowPipeline(false); },
        onError: (error) => toast({ title: "Generation failed", description: error.error || "An error occurred", variant: "destructive" }),
      },
    );
  };

  return (
    <ToolLayout
      title="Video Script Generator"
      description="AI writes your script — then produce the full video with voiceover, talking head presenter, and b-roll clips."
      output={output}
      isLoading={generate.isPending}
      onGenerate={handleGenerate}
      disabled={!topic}
      outputLabel="Your Video Script"
      outputFooter={
        output ? (
          <div className="mt-4 space-y-3">
            <button
              onClick={() => setShowPipeline((v) => !v)}
              className="w-full flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3 hover:bg-purple-500/15 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">AI Video Production Pipeline</span>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 hidden sm:inline-flex">
                  ElevenLabs · D-ID · HeyGen · Runway · Luma
                </Badge>
              </div>
              {showPipeline ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
            </button>

            {showPipeline && <VideoPipeline script={output} />}

            {!showPipeline && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Or paste this script into a free video tool
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FREE_TOOLS.map((tool) => (
                    <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 hover:bg-accent transition-colors group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{tool.name}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tool.color}`}>{tool.badge}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            <span className="font-semibold">How it works:</span> Write your script below, then use the{" "}
            <span className="text-purple-300 font-medium">AI Production Pipeline</span> to choose your preferred AI model for voiceover, talking head, and b-roll — or paste it straight into CapCut for free.
          </p>
        </div>

        <div className="space-y-2">
          <Label>What do you need?</Label>
          <Select value={toolType} onValueChange={setToolType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="video_script">Full Script</SelectItem>
              <SelectItem value="video_hook">Hook (First 5 secs)</SelectItem>
              <SelectItem value="video_outline">Structural Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube (8–15 min)</SelectItem>
              <SelectItem value="youtube_shorts">YouTube Shorts (≤60s)</SelectItem>
              <SelectItem value="tiktok">TikTok (≤60s)</SelectItem>
              <SelectItem value="reels">Instagram Reels (15–90s)</SelectItem>
              <SelectItem value="linkedin">LinkedIn Video</SelectItem>
              <SelectItem value="facebook">Facebook Video</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Topic / Product</Label>
          <Textarea
            placeholder="e.g., My new skincare range for sensitive skin — Shopify store"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Input
            placeholder="e.g., Women aged 25–45 with sensitive skin"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="entertainment">High Energy</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
                <SelectItem value="controversial">Disruptive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Video Length</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="60_seconds">Short (&lt;60s)</SelectItem>
                <SelectItem value="3_minutes">~3 minutes</SelectItem>
                <SelectItem value="10_minutes">Long form (10+ min)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
