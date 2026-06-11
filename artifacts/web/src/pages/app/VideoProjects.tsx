import { useState } from "react";
import {
  useListVideoProjects,
  useCreateVideoProject,
  useGetVideoProject,
  useUpdateVideoProject,
  useDeleteVideoProject,
} from "@workspace/api-client-react";
import { getListVideoProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, FolderOpen, Plus, Trash2, Pencil, Download, Mic, Video, Film, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { VideoProject, VideoProjectDetail } from "@workspace/api-zod";

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"><CheckCircle className="h-3 w-3 mr-1" />{status}</Badge>;
  if (status === "failed") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"><XCircle className="h-3 w-3 mr-1" />{status}</Badge>;
  return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
}

function ProjectDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: project, isLoading } = useGetVideoProject(id);

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!project) return <p className="text-center text-muted-foreground py-8">Project not found</p>;

  const detail = project as VideoProjectDetail;

  return (
    <div className="space-y-5">
      {detail.script && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Script</Label>
          <div className="p-3 bg-secondary/30 rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{detail.script}</div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Mic className="h-4 w-4 text-primary" />Voiceover
        </div>
        {detail.voiceoverJob ? (
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusBadge status={detail.voiceoverJob.status} />
              <span className="text-sm text-muted-foreground truncate max-w-xs">{detail.voiceoverJob.inputText.slice(0, 80)}</span>
            </div>
            {detail.voiceoverJob.outputUrl && (
              <a href={detail.voiceoverJob.outputUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1"><Download className="h-3.5 w-3.5" />Download</Button>
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic p-3 bg-secondary/20 rounded-lg">No voiceover generated yet — use Video Tools to create one</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Video className="h-4 w-4 text-primary" />Talking Head
        </div>
        {detail.talkingHeadJob ? (
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusBadge status={detail.talkingHeadJob.status} />
              <span className="text-sm text-muted-foreground">Talking head video</span>
            </div>
            {detail.talkingHeadJob.outputUrl && (
              <a href={detail.talkingHeadJob.outputUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1"><ExternalLink className="h-3.5 w-3.5" />View</Button>
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic p-3 bg-secondary/20 rounded-lg">No talking head generated yet</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Film className="h-4 w-4 text-primary" />B-roll Clips ({detail.brollJobs?.length ?? 0})
        </div>
        {detail.brollJobs && detail.brollJobs.length > 0 ? (
          <div className="space-y-2">
            {detail.brollJobs.map((job, i) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                  <StatusBadge status={job.status} />
                  <span className="text-sm text-muted-foreground truncate max-w-xs">{job.inputText.slice(0, 60)}</span>
                </div>
                {job.outputUrl && (
                  <a href={job.outputUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1"><ExternalLink className="h-3.5 w-3.5" />View</Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic p-3 bg-secondary/20 rounded-lg">No b-roll clips generated yet</p>
        )}
      </div>

      <Button variant="outline" onClick={onClose} className="w-full">Back to Projects</Button>
    </div>
  );
}

export default function VideoProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: projects = [], isLoading } = useListVideoProjects();
  const createProject = useCreateVideoProject();
  const deleteProject = useDeleteVideoProject();

  const [createDialog, setCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScript, setNewScript] = useState("");
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListVideoProjectsQueryKey() });

  function handleCreate() {
    if (!newName.trim()) { toast({ title: "Project name required", variant: "destructive" }); return; }
    createProject.mutate({
      data: { name: newName, script: newScript || null }
    }, {
      onSuccess: (data) => {
        toast({ title: "Project created" });
        setCreateDialog(false);
        setNewName("");
        setNewScript("");
        invalidate();
        setViewingId(data.id);
      },
      onError: () => toast({ title: "Failed to create", variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    deleteProject.mutate({ id }, {
      onSuccess: () => { toast({ title: "Project deleted" }); setDeleteConfirmId(null); invalidate(); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  function getJobSummary(project: VideoProject) {
    const ids = [];
    if (project.voiceoverJobId) ids.push("voiceover");
    if (project.talkingHeadJobId) ids.push("talking head");
    const brollCount = (project.brollJobIds as number[]).length;
    if (brollCount > 0) ids.push(`${brollCount} b-roll`);
    return ids.length ? ids.join(" · ") : "No assets yet";
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Video Projects</h1>
          <p className="text-muted-foreground">Organise your scripts, voiceovers, talking heads, and b-roll clips in one place.</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="gap-2"><Plus className="h-4 w-4" />New Project</Button>
      </div>

      {viewingId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              {projects.find(p => p.id === viewingId)?.name ?? "Project"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectDetail id={viewingId} onClose={() => setViewingId(null)} />
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-lg">No video projects yet</p>
              <p className="text-muted-foreground text-sm mt-1">Create a project to keep your script, voiceover, talking head, and b-roll organised together.</p>
            </div>
            <Button onClick={() => setCreateDialog(true)} className="gap-2"><Plus className="h-4 w-4" />Create your first project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(p => (
            <Card key={p.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setViewingId(p.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    {p.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={e => { e.stopPropagation(); setDeleteConfirmId(p.id); }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardDescription className="text-xs">{getJobSummary(p)}</CardDescription>
              </CardHeader>
              <CardContent>
                {p.script && <p className="text-xs text-muted-foreground line-clamp-2">{p.script}</p>}
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(p.createdAt), "MMM d, yyyy")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Video Project</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Summer Sale Campaign Video" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Script (optional)</Label>
              <Textarea value={newScript} onChange={e => setNewScript(e.target.value)} placeholder="Paste your video script here, or leave blank and add it later..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createProject.isPending}>
              {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this project?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">The project record will be deleted. The underlying video jobs will remain in your history.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteProject.isPending}>
              {deleteProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
