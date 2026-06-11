import { useState } from "react";
import {
  useListWorkspaces,
  useCreateWorkspace,
  useGetWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useInviteWorkspaceMember,
  useRemoveWorkspaceMember,
} from "@workspace/api-client-react";
import { getListWorkspacesQueryKey, getGetWorkspaceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Plus, Users, Trash2, Crown, UserPlus, Settings, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { WorkspaceWithRole, WorkspaceDetail } from "@workspace/api-zod";

function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"><Crown className="h-3 w-3 mr-1" />Owner</Badge>;
  if (role === "admin") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Admin</Badge>;
  return <Badge variant="outline" className="text-xs">Member</Badge>;
}

function WorkspaceView({ id, onBack }: { id: number; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: ws, isLoading } = useGetWorkspace(id);
  const inviteMember = useInviteWorkspaceMember();
  const removeMember = useRemoveWorkspaceMember();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteDialog, setInviteDialog] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetWorkspaceQueryKey(id) });

  function handleInvite() {
    if (!inviteEmail.trim()) { toast({ title: "Email required", variant: "destructive" }); return; }
    inviteMember.mutate({
      id,
      data: { email: inviteEmail, role: inviteRole }
    }, {
      onSuccess: () => { toast({ title: "Member added" }); setInviteDialog(false); setInviteEmail(""); invalidate(); },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to add member";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    });
  }

  function handleRemove(memberId: number, memberEmail: string) {
    if (!confirm(`Remove ${memberEmail} from this workspace?`)) return;
    removeMember.mutate({ id, memberId }, {
      onSuccess: () => { toast({ title: "Member removed" }); invalidate(); },
      onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
    });
  }

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ws) return <p className="text-center text-muted-foreground py-8">Workspace not found</p>;

  const detail = ws as WorkspaceDetail;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-2xl font-bold">{detail.name}</h2>
          <p className="text-sm text-muted-foreground">@{detail.slug} · <RoleBadge role={detail.role} /></p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary font-mono">{detail.credits}</p>
            <p className="text-sm text-muted-foreground mt-1">Credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{detail.members.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-bold capitalize">{detail.plan ?? "No plan"}</p>
            <p className="text-sm text-muted-foreground mt-1">Plan</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Team Members</CardTitle>
            {detail.role === "owner" && (
              <Button size="sm" onClick={() => setInviteDialog(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detail.members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{m.name ?? m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={m.role} />
                  {detail.role === "owner" && m.role !== "owner" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(m.id, m.email)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Invite Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email" />
              <p className="text-xs text-muted-foreground">They must already have a GoCopyAI account.</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={v => setInviteRole(v as "admin" | "member")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — can manage content and members</SelectItem>
                  <SelectItem value="member">Member — can create content only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteMember.isPending}>
              {inviteMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Workspaces() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: workspaces = [], isLoading } = useListWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [createDialog, setCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });

  function handleCreate() {
    if (!newName.trim()) { toast({ title: "Workspace name required", variant: "destructive" }); return; }
    createWorkspace.mutate({ data: { name: newName } }, {
      onSuccess: (data) => {
        toast({ title: "Workspace created" });
        setCreateDialog(false);
        setNewName("");
        invalidate();
        setViewingId(data.id);
      },
      onError: () => toast({ title: "Failed to create", variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    deleteWorkspace.mutate({ id }, {
      onSuccess: () => { toast({ title: "Workspace deleted" }); setDeleteConfirmId(null); invalidate(); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (viewingId) {
    return (
      <div className="max-w-4xl mx-auto">
        <WorkspaceView id={viewingId} onBack={() => setViewingId(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Agency Workspaces</h1>
          <p className="text-muted-foreground">Manage multiple client brands under one account. Each workspace has its own team, brand profiles, and content.</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="gap-2"><Plus className="h-4 w-4" />New Workspace</Button>
      </div>

      {workspaces.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-lg">No workspaces yet</p>
              <p className="text-muted-foreground text-sm mt-1">Create a workspace for each client brand to keep their content, team, and brand profiles separate.</p>
            </div>
            <Button onClick={() => setCreateDialog(true)} className="gap-2"><Plus className="h-4 w-4" />Create your first workspace</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map(ws => (
            <Card key={ws.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setViewingId(ws.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {ws.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={ws.role} />
                    {ws.role === "owner" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setDeleteConfirmId(ws.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription className="text-xs">@{ws.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground"><span className="text-foreground font-semibold font-mono">{ws.credits}</span> credits</span>
                  {ws.plan && <span className="text-muted-foreground capitalize">{ws.plan} plan</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Created {format(new Date(ws.createdAt), "MMM d, yyyy")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Workspace</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Workspace Name *</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Acme Co, Client Brand" autoFocus onKeyDown={e => e.key === "Enter" && handleCreate()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createWorkspace.isPending}>
              {createWorkspace.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete workspace?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This will permanently delete the workspace and remove all members. Content in your personal account is unaffected.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteWorkspace.isPending}>
              {deleteWorkspace.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
