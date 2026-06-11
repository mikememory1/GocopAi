import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetPlans, useGetMe, useCreateCheckout, useCreatePortalSession, useTopupCredits } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Zap, TrendingUp, Rocket, Coins } from "lucide-react";

const CREDIT_PACKS = [
  {
    id: "boost",
    name: "Boost Pack",
    credits: 100,
    price: 9,
    description: "Quick top-up when you need it",
    icon: Zap,
  },
  {
    id: "growth",
    name: "Growth Pack",
    credits: 500,
    price: 39,
    description: "Best value for regular use",
    popular: true,
    icon: TrendingUp,
  },
  {
    id: "scale",
    name: "Scale Pack",
    credits: 1000,
    price: 69,
    description: "Maximum firepower, minimum cost per credit",
    icon: Rocket,
  },
] as const;

export default function Billing() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { data: plans, isLoading: plansLoading } = useGetPlans();
  const { data: me, isLoading: meLoading, refetch: refetchMe } = useGetMe();
  const checkout = useCreateCheckout();
  const portal = useCreatePortalSession();
  const topup = useTopupCredits();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      toast({ title: "Subscription activated!", description: "Your plan is now active and credits have been added." });
      refetchMe();
    } else if (params.get("topup") === "1") {
      toast({ title: "Credits added!", description: "Your credit top-up has been applied to your account." });
      refetchMe();
    }
  }, []);

  const handleSubscribe = (planId: string) => {
    checkout.mutate({ data: { planId } }, {
      onSuccess: (data) => { window.location.href = data.url; },
      onError: () => toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" }),
    });
  };

  const handleManage = () => {
    portal.mutate(undefined, {
      onSuccess: (data) => { window.location.href = data.url; },
      onError: () => toast({ title: "Error", description: "Failed to open billing portal. Please try again.", variant: "destructive" }),
    });
  };

  const handleTopup = (packId: string) => {
    topup.mutate({ data: { packId } }, {
      onSuccess: (data) => { window.location.href = data.url; },
      onError: () => toast({ title: "Error", description: "Failed to start top-up checkout. Please try again.", variant: "destructive" }),
    });
  };

  if (plansLoading || meLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isSubscribed = me?.planStatus === "active";

  return (
    <div className="max-w-5xl mx-auto space-y-12">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Billing & Plans</h1>
          <p className="text-muted-foreground">Manage your subscription and purchase extra credits.</p>
        </div>
        <div className="flex items-center gap-3">
          {me && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-mono font-bold text-primary">{me.credits}</span>
              <span className="text-sm text-muted-foreground">credits remaining</span>
            </div>
          )}
          {isSubscribed && (
            <Button variant="outline" onClick={handleManage} disabled={portal.isPending}>
              {portal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Manage Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Subscription plans */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground mt-1">Monthly plans that include a fresh credit allocation each billing period.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const isCurrentPlan = me?.currentPlan === plan.id;
            return (
              <Card key={plan.id} className={`flex flex-col ${isCurrentPlan ? "border-primary shadow-[0_0_20px_-10px_hsl(var(--primary))]" : "border-border"}`}>
                <CardHeader>
                  {isCurrentPlan && (
                    <Badge className="w-fit mb-2 bg-primary/20 text-primary border-0 hover:bg-primary/20">Current Plan</Badge>
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    {plan.interval && <span className="text-muted-foreground">/{plan.interval}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm font-medium mb-4 text-foreground">{plan.credits} credits / mo</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {!isCurrentPlan ? (
                    <Button
                      className="w-full"
                      variant={plan.price > 0 ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkout.isPending || (isSubscribed && !isCurrentPlan)}
                    >
                      {checkout.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {isSubscribed ? "Change Plan via Portal" : `Get ${plan.name}`}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled variant="secondary">Active</Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Credit top-up packs */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Credit Top-Up Packs</h2>
          <p className="text-sm text-muted-foreground mt-1">One-time purchases — credits are added immediately to your account, no subscription needed.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {CREDIT_PACKS.map((pack) => {
            const Icon = pack.icon;
            const centsPerCredit = (pack.price * 100) / pack.credits;
            return (
              <Card
                key={pack.id}
                className={`flex flex-col relative ${pack.popular ? "border-primary/60 shadow-[0_0_20px_-10px_hsl(var(--primary))]" : "border-border"}`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary px-3">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono">${pack.price}</span>
                    <span className="text-muted-foreground text-sm">one-time</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-semibold font-mono text-primary">{pack.credits.toLocaleString()} credits</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pack.description}</p>
                  <p className="text-xs text-muted-foreground font-mono">${(centsPerCredit / 100).toFixed(3)} per credit</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={pack.popular ? "default" : "outline"}
                    onClick={() => handleTopup(pack.id)}
                    disabled={topup.isPending}
                  >
                    {topup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Buy {pack.credits.toLocaleString()} Credits
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
