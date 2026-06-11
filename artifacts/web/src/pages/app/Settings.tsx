import { useState, useEffect, useCallback } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, CheckCircle, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export default function Settings() {
  const { data: me, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");

  const [shopifyDomain, setShopifyDomain] = useState("");
  const [shopifyToken, setShopifyToken] = useState("");
  const [shopifyStatus, setShopifyStatus] = useState<{ connected: boolean; storeDomain?: string | null } | null>(null);
  const [shopifyLoading, setShopifyLoading] = useState(false);

  const [wooUrl, setWooUrl] = useState("");
  const [wooKey, setWooKey] = useState("");
  const [wooSecret, setWooSecret] = useState("");
  const [wooLoading, setWooLoading] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setBusinessName(me.businessName || "");
      setWebsite(me.website || "");
    }
  }, [me]);

  const fetchShopifyStatus = useCallback(async () => {
    try {
      const data = await customFetch<{ connected: boolean; storeDomain?: string | null }>("/api/shopify/status");
      setShopifyStatus(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchShopifyStatus();
  }, [fetchShopifyStatus]);

  const handleSave = () => {
    updateMe.mutate(
      { data: { name, businessName, website } },
      {
        onSuccess: () => {
          toast({ title: "Profile updated", description: "Your settings have been saved." });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
        onError: () => toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" }),
      }
    );
  };

  const handleShopifyConnect = async () => {
    if (!shopifyDomain || !shopifyToken) {
      toast({ title: "Missing fields", description: "Enter both store domain and access token.", variant: "destructive" });
      return;
    }
    setShopifyLoading(true);
    try {
      const data = await customFetch<{ success: boolean; shopName?: string }>("/api/shopify/connect", {
        method: "POST",
        body: JSON.stringify({ storeDomain: shopifyDomain, accessToken: shopifyToken }),
      });
      toast({ title: "Shopify connected!", description: `Store: ${data.shopName || shopifyDomain}` });
      setShopifyToken("");
      fetchShopifyStatus();
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    } finally {
      setShopifyLoading(false);
    }
  };

  const handleShopifyDisconnect = async () => {
    setShopifyLoading(true);
    try {
      await customFetch("/api/shopify/connect", { method: "DELETE" });
      toast({ title: "Shopify disconnected" });
      setShopifyStatus({ connected: false });
    } catch {
      toast({ title: "Error", description: "Could not disconnect.", variant: "destructive" });
    } finally {
      setShopifyLoading(false);
    }
  };

  const handleWooConnect = async () => {
    if (!wooUrl || !wooKey || !wooSecret) {
      toast({ title: "Missing fields", description: "Fill in all WooCommerce fields.", variant: "destructive" });
      return;
    }
    setWooLoading(true);
    try {
      await customFetch("/api/shopify/woocommerce/connect", {
        method: "POST",
        body: JSON.stringify({ siteUrl: wooUrl, consumerKey: wooKey, consumerSecret: wooSecret }),
      });
      toast({ title: "WooCommerce connected!", description: "Products are now available in AI tools." });
      setWooKey("");
      setWooSecret("");
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    } finally {
      setWooLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and integrations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This information is used to personalise your generated content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={me?.email} disabled className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-border pt-6">
          <Button onClick={handleSave} disabled={updateMe.isPending}>
            {updateMe.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-green-400" />
            <CardTitle>Shopify Integration</CardTitle>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">NEW</Badge>
          </div>
          <CardDescription>
            Connect your Shopify store to pull product data directly into your AI-generated content.{" "}
            <a
              href="https://shopify.dev/docs/apps/auth/admin-app-access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              How to get an access token <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shopifyStatus?.connected ? (
            <div className="flex items-center justify-between p-3 rounded-md border border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">Connected</p>
                  <p className="text-xs text-muted-foreground">{shopifyStatus.storeDomain}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={handleShopifyDisconnect} disabled={shopifyLoading}>
                {shopifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="ml-2">Disconnect</span>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Store Domain</Label>
                <Input
                  value={shopifyDomain}
                  onChange={(e) => setShopifyDomain(e.target.value)}
                  placeholder="mystore.myshopify.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Admin API Access Token</Label>
                <Input
                  value={shopifyToken}
                  onChange={(e) => setShopifyToken(e.target.value)}
                  type="password"
                  placeholder="shpat_..."
                />
              </div>
              <Button onClick={handleShopifyConnect} disabled={shopifyLoading}>
                {shopifyLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Connect Shopify
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-400" />
            <CardTitle>WooCommerce Integration</CardTitle>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">NEW</Badge>
          </div>
          <CardDescription>
            Connect your WooCommerce store via REST API credentials. Find keys under WooCommerce → Settings → Advanced → REST API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site URL</Label>
            <Input value={wooUrl} onChange={(e) => setWooUrl(e.target.value)} placeholder="https://yourstore.com" />
          </div>
          <div className="space-y-2">
            <Label>Consumer Key</Label>
            <Input value={wooKey} onChange={(e) => setWooKey(e.target.value)} placeholder="ck_..." />
          </div>
          <div className="space-y-2">
            <Label>Consumer Secret</Label>
            <Input value={wooSecret} onChange={(e) => setWooSecret(e.target.value)} type="password" placeholder="cs_..." />
          </div>
          <Button onClick={handleWooConnect} disabled={wooLoading}>
            {wooLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Connect WooCommerce
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-md bg-secondary/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">Current Plan</div>
              <div className="text-xl font-bold capitalize">{me?.currentPlan || "Starter"}</div>
            </div>
            <div className="p-4 border border-border rounded-md bg-secondary/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">Available Credits</div>
              <div className="text-xl font-bold font-mono text-primary">{me?.credits}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
