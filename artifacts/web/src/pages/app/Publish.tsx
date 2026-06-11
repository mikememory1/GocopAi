import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import {
  Linkedin, Facebook, Instagram, Twitter, Youtube, Send, CheckCircle2,
  XCircle, Loader2, Upload, FileVideo, FileImage, Trash2, AlertCircle, Link2,
  Clock, CalendarClock, Ban, ChevronDown, ChevronUp,
} from "lucide-react";
import { SiTiktok, SiThreads, SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

type Platform = "linkedin" | "facebook" | "instagram" | "threads" | "twitter" | "tiktok" | "youtube" | "telegram";
type ScheduleStatus = "pending" | "publishing" | "published" | "failed" | "cancelled";

interface SocialAccount {
  id: number;
  platform: Platform;
  platformUsername: string | null;
  platformPageName: string | null;
  createdAt: string;
}

interface ScheduledPost {
  id: number;
  platforms: string[];
  caption: string;
  mediaObjectPath: string | null;
  mediaType: string | null;
  scheduledAt: string;
  status: ScheduleStatus;
  publishResults: Record<string, { success: boolean; id?: string; error?: string }> | null;
  errorMessage: string | null;
  createdAt: string;
}

interface PlatformMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  supportsText: boolean;
  supportsVideo: boolean;
  connectPath: string;
}

const PLATFORM_META: Record<Platform, PlatformMeta> = {
  linkedin:  { label: "LinkedIn",        icon: <Linkedin className="w-5 h-5" />,         color: "bg-blue-600",    supportsText: true,  supportsVideo: false, connectPath: "/api/social/connect/linkedin"  },
  facebook:  { label: "Facebook",        icon: <Facebook className="w-5 h-5" />,         color: "bg-blue-500",    supportsText: true,  supportsVideo: true,  connectPath: "/api/social/connect/facebook"  },
  instagram: { label: "Instagram Reels", icon: <Instagram className="w-5 h-5" />,        color: "bg-pink-600",    supportsText: false, supportsVideo: true,  connectPath: "/api/social/connect/instagram" },
  threads:   { label: "Threads",         icon: <SiThreads className="w-5 h-5" />,        color: "bg-gray-800",    supportsText: true,  supportsVideo: false, connectPath: "/api/social/connect/threads"   },
  twitter:   { label: "Twitter / X",     icon: <Twitter className="w-5 h-5" />,          color: "bg-black",       supportsText: true,  supportsVideo: true,  connectPath: "/api/social/connect/twitter"   },
  tiktok:    { label: "TikTok",          icon: <SiTiktok className="w-5 h-5" />,         color: "bg-neutral-900", supportsText: false, supportsVideo: true,  connectPath: "/api/social/connect/tiktok"    },
  youtube:   { label: "YouTube Shorts",  icon: <Youtube className="w-5 h-5" />,          color: "bg-red-600",     supportsText: false, supportsVideo: true,  connectPath: "/api/social/connect/youtube"   },
  telegram:  { label: "Telegram",        icon: <SiTelegram className="w-5 h-5" />,       color: "bg-sky-500",     supportsText: true,  supportsVideo: true,  connectPath: ""                              },
};

const ALL_PLATFORMS = Object.keys(PLATFORM_META) as Platform[];

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: "Scheduled",  color: "text-blue-500",   icon: <Clock className="w-4 h-4" /> },
  publishing: { label: "Posting…",   color: "text-yellow-500", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  published:  { label: "Published",  color: "text-green-500",  icon: <CheckCircle2 className="w-4 h-4" /> },
  failed:     { label: "Failed",     color: "text-red-500",    icon: <XCircle className="w-4 h-4" /> },
  cancelled:  { label: "Cancelled",  color: "text-muted-foreground", icon: <Ban className="w-4 h-4" /> },
};

function minDateTimeLocal() {
  const d = new Date(Date.now() + 60_000);
  return d.toISOString().slice(0, 16);
}

function formatScheduledAt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Publish() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [text, setText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [uploadedObjectPath, setUploadedObjectPath] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<Record<string, { success: boolean; id?: string; error?: string }> | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  // Scheduling state
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showQueue, setShowQueue] = useState(true);

  const authHeaders = useCallback(async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, [getToken]);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: accountsData } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const h = await authHeaders();
      const res = await fetch("/api/social/accounts", { headers: h });
      return res.json() as Promise<{ accounts: SocialAccount[] }>;
    },
  });

  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const h = await authHeaders();
      const res = await fetch("/api/social/scheduled", { headers: h });
      return res.json() as Promise<{ posts: ScheduledPost[] }>;
    },
    refetchInterval: 15_000,
  });

  const connectedPlatforms = new Set((accountsData?.accounts || []).map((a) => a.platform));

  // ── Mutations ─────────────────────────────────────────────────────────────

  const disconnectMutation = useMutation({
    mutationFn: async (platform: Platform) => {
      const h = await authHeaders();
      await fetch(`/api/social/accounts/${platform}`, { method: "DELETE", headers: h });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      toast({ title: "Account disconnected" });
    },
  });

  const connectTelegramMutation = useMutation({
    mutationFn: async ({ botToken, chatId }: { botToken: string; chatId: string }) => {
      const h = await authHeaders();
      const res = await fetch("/api/social/telegram", {
        method: "POST", headers: h,
        body: JSON.stringify({ botToken, chatId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      toast({ title: "Telegram connected!" });
      setShowTelegramModal(false);
      setTelegramBotToken(""); setTelegramChatId("");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const h = await authHeaders();
      const res = await fetch("/api/social/publish", {
        method: "POST", headers: h,
        body: JSON.stringify({
          text,
          platforms: Array.from(selectedPlatforms),
          mediaUrl: uploadedMediaUrl,
          mediaType: mediaFile?.type.startsWith("video/") ? "video" : mediaFile ? "image" : undefined,
        }),
      });
      return res.json() as Promise<{ results: Record<string, { success: boolean; id?: string; error?: string }> }>;
    },
    onSuccess: (data) => {
      setResults(data.results);
      const successes = Object.values(data.results).filter((r) => r.success).length;
      const failures = Object.values(data.results).filter((r) => !r.success).length;
      toast({
        title: `Published to ${successes} platform${successes !== 1 ? "s" : ""}${failures > 0 ? `, ${failures} failed` : ""}`,
        variant: failures > 0 && successes === 0 ? "destructive" : "default",
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const h = await authHeaders();
      const res = await fetch("/api/social/schedule", {
        method: "POST", headers: h,
        body: JSON.stringify({
          caption: text,
          platforms: Array.from(selectedPlatforms),
          mediaObjectPath: uploadedObjectPath,
          mediaType: mediaFile?.type.startsWith("video/") ? "video" : mediaFile ? "image" : undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast({ title: "Post scheduled!", description: `Will publish at ${formatScheduledAt(scheduledAt)}` });
      setText(""); setSelectedPlatforms(new Set()); setScheduledAt("");
      setMediaFile(null); setMediaPreview(null); setUploadedMediaUrl(null); setUploadedObjectPath(null);
      setScheduleMode(false);
      setShowQueue(true);
    },
    onError: (err: Error) => toast({ title: "Schedule failed", description: err.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const h = await authHeaders();
      const res = await fetch(`/api/social/scheduled/${id}`, { method: "DELETE", headers: h });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast({ title: "Post cancelled" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setUploadedMediaUrl(null);
    setUploadedObjectPath(null);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const h = await authHeaders();
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST", headers: h,
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const { uploadURL, objectPath } = await urlRes.json();

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      await new Promise<void>((resolve, reject) => {
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      const publicUrl = `${window.location.origin}/api/storage/objects/${objectPath.replace(/^\/objects\//, "")}`;
      setUploadedMediaUrl(publicUrl);
      setUploadedObjectPath(objectPath);
      toast({ title: "File uploaded successfully" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [authHeaders, toast]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      next.has(platform) ? next.delete(platform) : next.add(platform);
      return next;
    });
  };

  const mediaType = mediaFile?.type.startsWith("video/") ? "video" : "image";
  const canPost = text.trim().length > 0 && selectedPlatforms.size > 0 && !isUploading && !publishMutation.isPending && !scheduleMutation.isPending;
  const canSchedule = canPost && scheduleMode && !!scheduledAt;

  const queuedPosts = scheduledData?.posts ?? [];
  const pendingCount = queuedPosts.filter((p) => p.status === "pending").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publish Content</h1>
          <p className="text-muted-foreground mt-1">Write once. Publish everywhere.</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="mt-2 gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {pendingCount} scheduled
          </Badge>
        )}
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Accounts</CardTitle>
          <CardDescription>Connect your social media accounts to publish content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_PLATFORMS.map((platform) => {
              const meta = PLATFORM_META[platform];
              const account = accountsData?.accounts.find((a) => a.platform === platform);
              const connected = !!account;
              return (
                <div key={platform} className={`relative rounded-xl border p-3 flex flex-col gap-2 transition-all ${connected ? "border-green-500/40 bg-green-500/5" : "border-border"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`${meta.color} text-white rounded-lg p-1.5`}>{meta.icon}</div>
                    <span className="text-sm font-medium truncate">{meta.label}</span>
                  </div>
                  {connected ? (
                    <>
                      <p className="text-xs text-muted-foreground truncate">{account.platformPageName || account.platformUsername || "Connected"}</p>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => disconnectMutation.mutate(platform)}>
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                      if (platform === "telegram") { setShowTelegramModal(true); return; }
                      window.location.href = meta.connectPath;
                    }}>
                      <Link2 className="w-3 h-3 mr-1" /> Connect
                    </Button>
                  )}
                  {connected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compose Post</CardTitle>
          <CardDescription>Write your content and upload media if needed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What do you want to say? Write your caption, post, or script here…"
            className="min-h-[160px] resize-none text-base"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{text.length} characters</span>
            {text.length > 280 && <span className="text-yellow-500">Twitter/X will truncate beyond 280 chars</span>}
          </div>

          {/* Media Upload */}
          <div className="border-2 border-dashed rounded-xl p-4">
            {mediaPreview ? (
              <div className="space-y-3">
                <div className="relative">
                  {mediaType === "video" ? (
                    <video src={mediaPreview} className="w-full max-h-64 rounded-lg object-contain bg-black" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full max-h-64 rounded-lg object-contain" />
                  )}
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 w-7 h-7"
                    onClick={() => { setMediaFile(null); setMediaPreview(null); setUploadedMediaUrl(null); setUploadedObjectPath(null); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {isUploading ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span>Uploading…</span><span>{uploadProgress}%</span></div>
                    <Progress value={uploadProgress} />
                  </div>
                ) : uploadedMediaUrl ? (
                  <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Ready to post</p>
                ) : null}
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 cursor-pointer py-6">
                <div className="flex gap-4 text-muted-foreground">
                  <FileVideo className="w-8 h-8" /><FileImage className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Upload video or image</p>
                  <p className="text-sm text-muted-foreground">MP4, MOV, AVI, JPG, PNG · Max 2GB</p>
                </div>
                <Button variant="outline" size="sm" type="button"><Upload className="w-4 h-4 mr-2" />Choose File</Button>
                <input type="file" className="hidden" accept="video/*,image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Platforms</CardTitle>
          <CardDescription>Choose where to publish. Only connected accounts are selectable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_PLATFORMS.map((platform) => {
              const meta = PLATFORM_META[platform];
              const connected = connectedPlatforms.has(platform);
              const selected = selectedPlatforms.has(platform);
              const disabled = !connected || (mediaFile && mediaType === "video" && !meta.supportsVideo) || (!mediaFile && !meta.supportsText);
              return (
                <button key={platform} onClick={() => !disabled && togglePlatform(platform)} disabled={!!disabled}
                  className={`rounded-xl border p-3 flex items-center gap-2 transition-all text-left
                    ${selected && !disabled ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border"}
                    ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"}`}>
                  <div className={`${meta.color} text-white rounded-lg p-1.5 shrink-0`}>{meta.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {!connected ? "Not connected" : !meta.supportsText && !mediaFile ? "Video required" : meta.supportsVideo && meta.supportsText ? "Text & Video" : meta.supportsVideo ? "Video only" : "Text only"}
                    </p>
                  </div>
                  {selected && !disabled && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {selectedPlatforms.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedPlatforms).map((p) => (
                <Badge key={p} variant="secondary" className="gap-1">
                  {PLATFORM_META[p].label}
                  <button onClick={() => togglePlatform(p)} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling / Publish Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publish or Schedule</CardTitle>
          <CardDescription>Send your post immediately or pick a future date and time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setScheduleMode(false)}
              className={`flex-1 rounded-xl border p-3 text-sm font-medium transition-all flex items-center justify-center gap-2
                ${!scheduleMode ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/40"}`}>
              <Send className="w-4 h-4" /> Publish Now
            </button>
            <button
              onClick={() => setScheduleMode(true)}
              className={`flex-1 rounded-xl border p-3 text-sm font-medium transition-all flex items-center justify-center gap-2
                ${scheduleMode ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/40"}`}>
              <CalendarClock className="w-4 h-4" /> Schedule
            </button>
          </div>

          {scheduleMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Pick date & time</label>
              <input
                type="datetime-local"
                min={minDateTimeLocal()}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {scheduledAt && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Will publish {formatScheduledAt(scheduledAt)}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            {scheduleMode ? (
              <Button size="lg" onClick={() => scheduleMutation.mutate()} disabled={!canSchedule} className="px-8">
                {scheduleMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scheduling…</>
                  : <><CalendarClock className="w-4 h-4 mr-2" />Schedule for {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? "s" : ""}</>}
              </Button>
            ) : (
              <Button size="lg" onClick={() => publishMutation.mutate()} disabled={!canPost} className="px-8">
                {publishMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing…</>
                  : <><Send className="w-4 h-4 mr-2" />Publish to {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? "s" : ""}</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publish Results */}
      {results && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Publish Results</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(results).map(([platform, result]) => (
              <div key={platform} className={`flex items-center gap-3 p-3 rounded-lg ${result.success ? "bg-green-500/10" : "bg-destructive/10"}`}>
                <div className={`${PLATFORM_META[platform as Platform]?.color} text-white rounded-lg p-1.5`}>
                  {PLATFORM_META[platform as Platform]?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{PLATFORM_META[platform as Platform]?.label}</p>
                  {result.error && <p className="text-xs text-muted-foreground truncate">{result.error}</p>}
                </div>
                {result.success ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scheduled Queue */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowQueue((v) => !v)}>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="w-5 h-5" /> Scheduled Queue
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingCount} pending</Badge>
                )}
              </CardTitle>
              <CardDescription>Upcoming and past scheduled posts</CardDescription>
            </div>
            {showQueue ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
        </CardHeader>

        {showQueue && (
          <CardContent>
            {scheduledLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : queuedPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No scheduled posts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queuedPosts.map((post) => {
                  const cfg = STATUS_CONFIG[post.status];
                  return (
                    <div key={post.id} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2 text-foreground">{post.caption}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {post.platforms.map((p) => {
                          const meta = PLATFORM_META[p as Platform];
                          const result = post.publishResults?.[p];
                          return (
                            <span key={p} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white ${meta?.color ?? "bg-muted"}`}>
                              {meta?.icon && <span className="[&>svg]:w-3 [&>svg]:h-3">{meta.icon}</span>}
                              {meta?.label ?? p}
                              {result && (result.success
                                ? <CheckCircle2 className="w-3 h-3 ml-0.5" />
                                : <XCircle className="w-3 h-3 ml-0.5" />)}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {formatScheduledAt(post.scheduledAt)}
                        </span>
                        {post.status === "pending" && (
                          <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive px-2"
                            onClick={() => cancelMutation.mutate(post.id)}
                            disabled={cancelMutation.isPending}>
                            <Ban className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        )}
                        {post.status === "failed" && post.errorMessage && (
                          <span className="text-destructive">{post.errorMessage}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Connect Telegram</CardTitle>
              <CardDescription>Enter your Telegram bot token and the channel/chat ID to publish to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Create a bot at @BotFather, get your bot token, add the bot to your channel as admin, then get the chat ID (e.g. @yourchannel or -1001234567890)
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bot Token</label>
                <input className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="123456789:ABCdef…" value={telegramBotToken} onChange={(e) => setTelegramBotToken(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chat / Channel ID</label>
                <input className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="@yourchannel or -1001234567890" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowTelegramModal(false)}>Cancel</Button>
                <Button onClick={() => connectTelegramMutation.mutate({ botToken: telegramBotToken, chatId: telegramChatId })}
                  disabled={!telegramBotToken || !telegramChatId || connectTelegramMutation.isPending}>
                  {connectTelegramMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
