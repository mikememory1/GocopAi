import { useState } from "react";
import {
  useListBrandProfiles,
  useCreateBrandProfile,
  useUpdateBrandProfile,
  useDeleteBrandProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListBrandProfilesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Star, StarOff, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BrandProfile, BrandProfileInput } from "@workspace/api-zod";

const TONES = ["professional", "casual", "playful", "bold", "empathetic", "authoritative", "friendly"];
const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "X (Twitter)", "Pinterest", "Email"];
const INDUSTRIES = ["Fashion & Apparel", "Beauty & Skincare", "Health & Wellness", "Pet Supplies", "Home & Garden", "Electronics", "Food & Beverage", "Sports & Outdoors", "Baby & Kids", "Jewellery", "Other"];

const emptyForm = (): BrandProfileInput => ({
  name: "",
  industry: "",
  productDescription: "",
  targetAudience: "",
  tone: "professional",
  platforms: [],
  brandValues: "",
  competitors: "",
  isDefault: false,
});

export default function BrandProfiles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profiles = [], isLoading } = useListBrandProfiles();
  const createProfile = useCreateBrandProfile();
  const updateProfile = useUpdateBrandProfile();
  const deleteProfile = useDeleteBrandProfile();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BrandProfileInput>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBrandProfilesQueryKey() });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(p: BrandProfile) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      industry: p.industry ?? "",
      productDescription: p.productDescription ?? "",
      targetAudience: p.targetAudience ?? "",
      tone: p.tone,
      platforms: p.platforms,
      brandValues: p.brandValues ?? "",
      competitors: p.competitors ?? "",
      isDefault: p.isDefault,
    });
    setDialogOpen(true);
  }

  function togglePlatform(platform: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms?.includes(platform)
        ? f.platforms.filter(p => p !== platform)
        : [...(f.platforms ?? []), platform],
    }));
  }

  function handleSave() {
    if (!form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }

    const payload = {
      ...form,
      industry: form.industry || null,
      productDescription: form.productDescription || null,
      targetAudience: form.targetAudience || null,
      brandValues: form.brandValues || null,
      competitors: form.competitors || null,
    };

    if (editingId) {
      updateProfile.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast({ title: "Brand profile updated" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createProfile.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Brand profile created" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteProfile.mutate({ id }, {
      onSuccess: () => { toast({ title: "Profile deleted" }); setDeleteConfirmId(null); invalidate(); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  function handleSetDefault(p: BrandProfile) {
    updateProfile.mutate({ id: p.id, data: { name: p.name, isDefault: true } }, {
      onSuccess: () => { toast({ title: `"${p.name}" set as default` }); invalidate(); },
    });
  }

  const isSaving = createProfile.isPending || updateProfile.isPending;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Brand Profiles</h1>
          <p className="text-muted-foreground">Save your brand voice, audience, and style. Every AI tool will auto-fill from your default profile.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New Profile</Button>
      </div>

      {profiles.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-lg">No brand profiles yet</p>
              <p className="text-muted-foreground text-sm mt-1">Create your first brand profile and stop filling in the same fields every time.</p>
            </div>
            <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Create your first profile</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map(p => (
            <Card key={p.id} className={p.isDefault ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {p.name}
                    {p.isDefault && <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Default</Badge>}
                  </CardTitle>
                  <div className="flex gap-1">
                    {!p.isDefault && (
                      <Button variant="ghost" size="icon" onClick={() => handleSetDefault(p)} title="Set as default">
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {p.isDefault && <Star className="h-4 w-4 text-yellow-500 mt-2 mr-1" />}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                {p.industry && <CardDescription>{p.industry}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                {p.productDescription && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Product</p>
                    <p className="text-sm line-clamp-2">{p.productDescription}</p>
                  </div>
                )}
                {p.targetAudience && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Audience</p>
                    <p className="text-sm line-clamp-1">{p.targetAudience}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-xs capitalize">{p.tone}</Badge>
                  {(p.platforms as string[]).map(pl => (
                    <Badge key={pl} variant="secondary" className="text-xs">{pl}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Brand Profile" : "New Brand Profile"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profile Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. My Shopify Store" />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={form.industry ?? ""} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product / Service Description</Label>
              <Textarea value={form.productDescription ?? ""} onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))} placeholder="What do you sell? Include key features, materials, price range..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Textarea value={form.targetAudience ?? ""} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="Who buys from you? Age, interests, pain points, buying motivations..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Brand Tone</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, tone: t }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${form.tone === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Active Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(pl => (
                  <button key={pl} type="button"
                    onClick={() => togglePlatform(pl)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${(form.platforms ?? []).includes(pl) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                    {pl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Brand Values / USPs</Label>
              <Textarea value={form.brandValues ?? ""} onChange={e => setForm(f => ({ ...f, brandValues: e.target.value }))} placeholder="What makes you different? Sustainable, handmade, award-winning, 30-day returns..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Competitors (optional)</Label>
              <Input value={form.competitors ?? ""} onChange={e => setForm(f => ({ ...f, competitors: e.target.value }))} placeholder="e.g. Brand A, Brand B, Brand C" />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="isDefault" checked={!!form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="h-4 w-4 accent-primary" />
              <Label htmlFor="isDefault" className="cursor-pointer">Set as default profile (auto-fills all AI tools)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this profile?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This cannot be undone. Any saved content that references this profile will be unaffected.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteProfile.isPending}>
              {deleteProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
