import { useState, useMemo } from "react";
import {
  useListCalendarItems,
  useCreateCalendarItem,
  useUpdateCalendarItem,
  useDeleteCalendarItem,
  useAiFillCalendar,
  useListBrandProfiles,
} from "@workspace/api-client-react";
import { getListCalendarItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Plus, Sparkles, Trash2, Pencil, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import type { CalendarItem } from "@workspace/api-zod";

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "Pinterest", "Email", "Blog"];
const CONTENT_TYPES = ["post", "reel", "story", "carousel", "blog", "email", "ad", "video"];
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Facebook: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  TikTok: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  LinkedIn: "bg-sky-600/20 text-sky-400 border-sky-600/30",
  YouTube: "bg-red-500/20 text-red-400 border-red-500/30",
  Pinterest: "bg-rose-600/20 text-rose-400 border-rose-600/30",
  Email: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Blog: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function getPlatformStyle(platform: string) {
  return PLATFORM_COLORS[platform] ?? "bg-secondary text-secondary-foreground border-border";
}

export default function ContentCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, "yyyy-MM");

  const { data: items = [], isLoading } = useListCalendarItems({ params: { month: monthStr } });
  const { data: brandProfiles = [] } = useListBrandProfiles();
  const createItem = useCreateCalendarItem();
  const updateItem = useUpdateCalendarItem();
  const deleteItem = useDeleteCalendarItem();
  const aiFill = useAiFillCalendar();

  const [editDialog, setEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [editForm, setEditForm] = useState({ scheduledDate: "", platform: "", contentType: "post", title: "", content: "", status: "draft" });

  const [aiFillDialog, setAiFillDialog] = useState(false);
  const [aiFillForm, setAiFillForm] = useState({ platforms: [] as string[], postsPerWeek: 5, brandProfileId: "", topic: "" });
  const [aiFillPlatformToggle, setAiFillPlatformToggle] = useState<string[]>([]);

  const [viewItem, setViewItem] = useState<CalendarItem | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCalendarItemsQueryKey({ params: { month: monthStr } }) });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    for (const item of items) {
      if (!map[item.scheduledDate]) map[item.scheduledDate] = [];
      map[item.scheduledDate].push(item);
    }
    return map;
  }, [items]);

  function openCreate(date: string) {
    setEditingItem(null);
    setEditForm({ scheduledDate: date, platform: "Instagram", contentType: "post", title: "", content: "", status: "draft" });
    setEditDialog(true);
  }

  function openEdit(item: CalendarItem) {
    setEditingItem(item);
    setEditForm({
      scheduledDate: item.scheduledDate,
      platform: item.platform,
      contentType: item.contentType,
      title: item.title ?? "",
      content: item.content ?? "",
      status: item.status,
    });
    setEditDialog(true);
  }

  function handleSave() {
    if (!editForm.platform || !editForm.scheduledDate) { toast({ title: "Platform and date required", variant: "destructive" }); return; }
    const payload = {
      scheduledDate: editForm.scheduledDate,
      platform: editForm.platform,
      contentType: editForm.contentType,
      title: editForm.title || null,
      content: editForm.content || null,
      status: editForm.status as "draft" | "scheduled" | "published",
    };
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, data: payload }, {
        onSuccess: () => { toast({ title: "Item updated" }); setEditDialog(false); invalidate(); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createItem.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Item created" }); setEditDialog(false); invalidate(); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: number) {
    deleteItem.mutate({ id }, { onSuccess: () => { setViewItem(null); invalidate(); } });
  }

  function toggleAiFillPlatform(p: string) {
    setAiFillPlatformToggle(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function handleAiFill() {
    if (aiFillPlatformToggle.length === 0) { toast({ title: "Select at least one platform", variant: "destructive" }); return; }
    aiFill.mutate({
      data: {
        month: monthStr,
        platforms: aiFillPlatformToggle,
        postsPerWeek: aiFillForm.postsPerWeek,
        brandProfileId: aiFillForm.brandProfileId ? Number(aiFillForm.brandProfileId) : null,
        topic: aiFillForm.topic || null,
      }
    }, {
      onSuccess: (data) => {
        toast({ title: `✓ Generated ${data.items.length} posts`, description: `${data.creditsUsed} credits used` });
        setAiFillDialog(false);
        invalidate();
      },
      onError: () => toast({ title: "AI fill failed", variant: "destructive" }),
    });
  }

  const firstDayOffset = getDay(startOfMonth(currentMonth));
  const totalPosted = items.filter(i => i.status === "published").length;
  const totalScheduled = items.filter(i => i.status === "scheduled").length;
  const totalDrafts = items.filter(i => i.status === "draft").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Content Calendar</h1>
          <p className="text-muted-foreground">Plan and schedule 30 days of content. AI auto-fills empty slots in one click.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setAiFillDialog(true)}>
            <Sparkles className="h-4 w-4 text-primary" />AI Fill Month
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-xl font-semibold w-40 text-center">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><span className="text-green-400 font-semibold">{totalPosted}</span> published</span>
          <span><span className="text-blue-400 font-semibold">{totalScheduled}</span> scheduled</span>
          <span><span className="text-yellow-400 font-semibold">{totalDrafts}</span> drafts</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] border-r border-b border-border/50 bg-secondary/20" />
            ))}
            {days.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayItems = itemsByDate[dateStr] ?? [];
              const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
              return (
                <div
                  key={dateStr}
                  className="min-h-[110px] border-r border-b border-border/50 p-1.5 group relative hover:bg-secondary/30 transition-colors"
                >
                  <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map(item => (
                      <button
                        key={item.id}
                        onClick={() => setViewItem(item)}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded border truncate font-medium hover:opacity-80 transition-opacity ${getPlatformStyle(item.platform)}`}
                      >
                        {item.title || item.platform}
                      </button>
                    ))}
                    {dayItems.length > 3 && (
                      <p className="text-[10px] text-muted-foreground px-1">+{dayItems.length - 3} more</p>
                    )}
                  </div>
                  <button
                    onClick={() => openCreate(dateStr)}
                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-primary/20 hover:bg-primary/40"
                  >
                    <Plus className="h-3 w-3 text-primary" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingItem ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editForm.scheduledDate} onChange={e => setEditForm(f => ({ ...f, scheduledDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={editForm.platform} onValueChange={v => setEditForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={editForm.contentType} onValueChange={v => setEditForm(f => ({ ...f, contentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title / Caption</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Short title or caption hook..." />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} placeholder="Full post copy, script notes, or content brief..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createItem.isPending || updateItem.isPending}>
              {(createItem.isPending || updateItem.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewItem !== null} onOpenChange={() => setViewItem(null)}>
        {viewItem && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge className={`text-xs border ${getPlatformStyle(viewItem.platform)}`}>{viewItem.platform}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{viewItem.contentType}</Badge>
                <Badge variant="outline" className={`text-xs capitalize ${viewItem.status === "published" ? "text-green-400" : viewItem.status === "scheduled" ? "text-blue-400" : "text-yellow-400"}`}>{viewItem.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">{viewItem.scheduledDate}</p>
              {viewItem.title && <p className="font-semibold">{viewItem.title}</p>}
              {viewItem.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewItem.content}</p>}
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="destructive" size="sm" onClick={() => handleDelete(viewItem.id)} disabled={deleteItem.isPending}>
                {deleteItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setViewItem(null); openEdit(viewItem); }}>
                  <Pencil className="h-4 w-4 mr-1" />Edit
                </Button>
                <Button size="sm" onClick={() => setViewItem(null)}>Close</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={aiFillDialog} onOpenChange={setAiFillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Fill — {format(currentMonth, "MMMM yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Platforms to fill</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} type="button"
                    onClick={() => toggleAiFillPlatform(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${aiFillPlatformToggle.includes(p) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Posts per week: <span className="text-primary font-semibold">{aiFillForm.postsPerWeek}</span></Label>
              <input type="range" min={1} max={21} value={aiFillForm.postsPerWeek} onChange={e => setAiFillForm(f => ({ ...f, postsPerWeek: Number(e.target.value) }))} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>1/wk</span><span>21/wk</span></div>
            </div>
            {brandProfiles.length > 0 && (
              <div className="space-y-2">
                <Label>Brand Profile (optional)</Label>
                <Select value={aiFillForm.brandProfileId} onValueChange={v => setAiFillForm(f => ({ ...f, brandProfileId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Use brand voice from profile..." /></SelectTrigger>
                  <SelectContent>
                    {brandProfiles.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}{p.isDefault ? " (default)" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Topic Focus (optional)</Label>
              <Input value={aiFillForm.topic} onChange={e => setAiFillForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. summer sale, new product launch, tips..." />
            </div>
            <p className="text-xs text-muted-foreground">Credit cost: ~{Math.ceil((aiFillForm.postsPerWeek * 4.3) * 0.5)} credits</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiFillDialog(false)}>Cancel</Button>
            <Button onClick={handleAiFill} disabled={aiFill.isPending} className="gap-2">
              {aiFill.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
