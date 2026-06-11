import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, UserButton } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Video, 
  Search, 
  Share2, 
  Megaphone, 
  FileText, 
  Wrench, 
  History, 
  CreditCard, 
  Settings, 
  ShieldAlert,
  Loader2,
  Menu,
  Coins,
  Send,
  BookOpen,
  Building2,
  CalendarDays,
  Swords,
  BookMarked,
  Shuffle,
  FolderOpen,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
  badge?: string;
};

type NavSection = {
  heading?: string;
  links: NavLink[];
};

const sidebarSections: NavSection[] = [
  {
    links: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/publish", label: "Publish", icon: Send, highlight: true },
    ],
  },
  {
    heading: "AI Tools",
    links: [
      { href: "/app/video", label: "Video Tools", icon: Video },
      { href: "/app/seo", label: "SEO Tools", icon: Search },
      { href: "/app/social", label: "Social Tools", icon: Share2 },
      { href: "/app/ads", label: "Ads Tools", icon: Megaphone },
      { href: "/app/blog", label: "Blog Tools", icon: FileText },
      { href: "/app/tools", label: "Generic Tool", icon: Wrench },
    ],
  },
  {
    heading: "Power Features",
    links: [
      { href: "/app/brand-profiles", label: "Brand Profiles", icon: Building2, badge: "NEW" },
      { href: "/app/calendar", label: "Content Calendar", icon: CalendarDays, badge: "NEW" },
      { href: "/app/competitor", label: "Competitor Analysis", icon: Swords, badge: "NEW" },
      { href: "/app/templates", label: "Template Library", icon: BookMarked, badge: "NEW" },
      { href: "/app/variants", label: "A/B Variants", icon: Shuffle, badge: "NEW" },
      { href: "/app/video-projects", label: "Video Projects", icon: FolderOpen, badge: "NEW" },
      { href: "/app/workspaces", label: "Agency Workspaces", icon: Users, badge: "NEW" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/app/quiz-history", label: "Quiz History", icon: History },
      { href: "/app/billing", label: "Billing", icon: CreditCard },
      { href: "/app/settings", label: "Settings", icon: Settings },
      { href: "/guide", label: "Training Guide", icon: BookOpen },
    ],
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn } });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || !isSignedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="font-mono text-lg font-bold text-primary tracking-tighter">GoCopyAI</div>
        <div className="flex items-center gap-4">
          {me && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 font-mono">
              <Coins className="h-3 w-3" />
              {me.credits}
            </Badge>
          )}
          <UserButton afterSignOutUrl="/" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
              <SidebarContent role={me?.role} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div className="font-mono text-xl font-bold text-primary tracking-tighter">GoCopyAI</div>
        </div>
        <ScrollArea className="flex-1">
          <SidebarContent role={me?.role} />
        </ScrollArea>
        <div className="p-4 border-t border-sidebar-border flex items-center justify-between bg-sidebar">
          {me ? (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 font-mono px-3 py-1">
              <Coins className="h-4 w-4" />
              {me.credits}
            </Badge>
          ) : <div />}
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ role }: { role?: string }) {
  const [location] = useLocation();

  return (
    <nav className="p-4 space-y-5">
      {sidebarSections.map((section, si) => (
        <div key={si} className="space-y-0.5">
          {section.heading && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 pb-1">{section.heading}</p>
          )}
          {section.links.map((link) => {
            const isActive = location === link.href || (link.href !== "/app" && location.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : link.highlight
                    ? "text-primary hover:bg-primary/10"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}>
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{link.label}</span>
                  {link.badge && !isActive && (
                    <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">{link.badge}</span>
                  )}
                  {link.highlight && !isActive && !link.badge && (
                    <span className="ml-auto text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
      
      {role === "admin" && (
        <div className="space-y-0.5">
          <div className="my-1 border-t border-sidebar-border" />
          <Link href="/app/admin">
            <span className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
              location.startsWith("/app/admin")
                ? "bg-destructive/10 text-destructive border border-destructive/20" 
                : "text-sidebar-foreground hover:bg-destructive/5 hover:text-destructive"
            )}>
              <ShieldAlert className="h-4 w-4" />
              Admin Panel
            </span>
          </Link>
        </div>
      )}
    </nav>
  );
}
