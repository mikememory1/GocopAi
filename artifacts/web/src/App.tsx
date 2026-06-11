import { ClerkProvider, useClerk, useAuth } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { setAuthTokenGetter, useEnsureUser } from "@workspace/api-client-react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AppLayout from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import SignInPage from "@/pages/auth/SignIn";
import SignUpPage from "@/pages/auth/SignUp";
import Dashboard from "@/pages/app/Dashboard";
import VideoTools from "@/pages/app/VideoTools";
import SeoTools from "@/pages/app/SeoTools";
import SocialTools from "@/pages/app/SocialTools";
import AdsTools from "@/pages/app/AdsTools";
import BlogTools from "@/pages/app/BlogTools";
import GenericTool from "@/pages/app/GenericTool";
import QuizHistory from "@/pages/app/QuizHistory";
import Billing from "@/pages/app/Billing";
import Settings from "@/pages/app/Settings";
import Admin from "@/pages/app/Admin";
import Onboarding from "@/pages/app/Onboarding";
import Publish from "@/pages/app/Publish";
import BrandProfiles from "@/pages/app/BrandProfiles";
import ContentCalendar from "@/pages/app/ContentCalendar";
import CompetitorAnalysis from "@/pages/app/CompetitorAnalysis";
import Templates from "@/pages/app/Templates";
import VideoProjects from "@/pages/app/VideoProjects";
import ABVariants from "@/pages/app/ABVariants";
import Workspaces from "@/pages/app/Workspaces";
import Guide from "@/pages/Guide";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — add it to your Replit Secrets.');
}

const clerkAppearance = {
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "hsl(210 100% 50%)",
    colorForeground: "hsl(220 10% 90%)",
    colorMutedForeground: "hsl(220 10% 60%)",
    colorDanger: "hsl(0 80% 60%)",
    colorBackground: "hsl(220 15% 8%)",
    colorInput: "hsl(220 15% 18%)",
    colorInputForeground: "hsl(220 10% 90%)",
    colorNeutral: "hsl(220 15% 15%)",
    fontFamily: "Geist, Inter, sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card border border-border rounded-md w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-sm text-muted-foreground",
    dividerText: "text-xs text-muted-foreground uppercase",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function TokenSetter() {
  const { getToken, isSignedIn } = useAuth();
  
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  const ensureUser = useEnsureUser();
  const initialized = useRef(false);

  useEffect(() => {
    if (isSignedIn && !initialized.current) {
      initialized.current = true;
      ensureUser.mutate();
    } else if (!isSignedIn) {
      initialized.current = false;
    }
  }, [isSignedIn, ensureUser]);

  return null;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/guide" component={Guide} />
      <Route path="/privacy" component={Privacy} />

      <Route path="/app">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/app/onboarding">
        <AppLayout><Onboarding /></AppLayout>
      </Route>
      <Route path="/app/video">
        <AppLayout><VideoTools /></AppLayout>
      </Route>
      <Route path="/app/seo">
        <AppLayout><SeoTools /></AppLayout>
      </Route>
      <Route path="/app/social">
        <AppLayout><SocialTools /></AppLayout>
      </Route>
      <Route path="/app/ads">
        <AppLayout><AdsTools /></AppLayout>
      </Route>
      <Route path="/app/blog">
        <AppLayout><BlogTools /></AppLayout>
      </Route>
      <Route path="/app/tools">
        <AppLayout><GenericTool /></AppLayout>
      </Route>
      <Route path="/app/publish">
        <AppLayout><Publish /></AppLayout>
      </Route>
      <Route path="/app/quiz-history">
        <AppLayout><QuizHistory /></AppLayout>
      </Route>
      <Route path="/app/billing">
        <AppLayout><Billing /></AppLayout>
      </Route>
      <Route path="/app/settings">
        <AppLayout><Settings /></AppLayout>
      </Route>
      <Route path="/app/admin">
        <AppLayout><Admin /></AppLayout>
      </Route>
      <Route path="/app/brand-profiles">
        <AppLayout><BrandProfiles /></AppLayout>
      </Route>
      <Route path="/app/calendar">
        <AppLayout><ContentCalendar /></AppLayout>
      </Route>
      <Route path="/app/competitor">
        <AppLayout><CompetitorAnalysis /></AppLayout>
      </Route>
      <Route path="/app/templates">
        <AppLayout><Templates /></AppLayout>
      </Route>
      <Route path="/app/video-projects">
        <AppLayout><VideoProjects /></AppLayout>
      </Route>
      <Route path="/app/variants">
        <AppLayout><ABVariants /></AppLayout>
      </Route>
      <Route path="/app/workspaces">
        <AppLayout><Workspaces /></AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      afterSignInUrl={`${basePath}/app`}
      afterSignUpUrl={`${basePath}/app`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TokenSetter />
        <AppRoutes />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <Toaster />
      </TooltipProvider>
    </WouterRouter>
  );
}

export default App;
