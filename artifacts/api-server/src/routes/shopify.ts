import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function getDbUser(clerkId: string) {
  const rows = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  return rows[0] ?? null;
}

// POST /api/shopify/connect
router.post("/connect", requireAuth, async (req, res) => {
  const { storeDomain, accessToken } = req.body as { storeDomain: string; accessToken: string };
  if (!storeDomain || !accessToken) {
    res.status(400).json({ error: "storeDomain and accessToken are required" });
    return;
  }

  const domain = storeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Verify credentials by making a test API call
  try {
    const testRes = await fetch(`https://${domain}/admin/api/2024-04/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });
    if (!testRes.ok) {
      res.status(400).json({ error: "Invalid Shopify credentials. Check your store domain and access token." });
      return;
    }
    const shopData = await testRes.json() as { shop?: { name?: string } };

    await db.update(usersTable).set({
      shopifyStoreDomain: domain,
      shopifyAccessToken: accessToken,
    }).where(eq(usersTable.id, user.id));

    res.json({ success: true, shopName: shopData.shop?.name });
  } catch {
    res.status(400).json({ error: "Could not connect to Shopify store." });
  }
});

// DELETE /api/shopify/connect
router.delete("/connect", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.update(usersTable).set({
    shopifyStoreDomain: null,
    shopifyAccessToken: null,
  }).where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

// GET /api/shopify/products
router.get("/products", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!user.shopifyStoreDomain || !user.shopifyAccessToken) {
    res.status(400).json({ error: "Shopify not connected" });
    return;
  }

  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const search = req.query.search as string | undefined;

  try {
    const url = new URL(`https://${user.shopifyStoreDomain}/admin/api/2024-04/products.json`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", "id,title,body_html,vendor,product_type,tags,images,variants");
    if (search) url.searchParams.set("title", search);

    const apiRes = await fetch(url.toString(), {
      headers: { "X-Shopify-Access-Token": user.shopifyAccessToken },
    });

    if (!apiRes.ok) {
      res.status(502).json({ error: "Failed to fetch Shopify products" });
      return;
    }

    const data = await apiRes.json() as {
      products: Array<{
        id: number;
        title: string;
        body_html: string;
        vendor: string;
        product_type: string;
        tags: string;
        images: Array<{ src: string }>;
        variants: Array<{ price: string; compare_at_price?: string }>;
      }>;
    };

    const products = data.products.map((p) => ({
      id: String(p.id),
      title: p.title,
      description: p.body_html?.replace(/<[^>]+>/g, " ").trim().slice(0, 300),
      vendor: p.vendor,
      type: p.product_type,
      tags: p.tags,
      price: p.variants?.[0]?.price,
      compareAtPrice: p.variants?.[0]?.compare_at_price,
      imageUrl: p.images?.[0]?.src,
    }));

    res.json({ products, connected: true, storeDomain: user.shopifyStoreDomain });
  } catch {
    res.status(502).json({ error: "Failed to fetch Shopify products" });
  }
});

// GET /api/shopify/status
router.get("/status", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json({
    connected: !!(user.shopifyStoreDomain && user.shopifyAccessToken),
    storeDomain: user.shopifyStoreDomain ?? null,
  });
});

// POST /api/shopify/woocommerce/connect
router.post("/woocommerce/connect", requireAuth, async (req, res) => {
  const { siteUrl, consumerKey, consumerSecret } = req.body as {
    siteUrl: string;
    consumerKey: string;
    consumerSecret: string;
  };
  if (!siteUrl || !consumerKey || !consumerSecret) {
    res.status(400).json({ error: "siteUrl, consumerKey, and consumerSecret are required" });
    return;
  }

  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const cleanUrl = siteUrl.replace(/\/$/, "");

  try {
    const testRes = await fetch(
      `${cleanUrl}/wp-json/wc/v3/system_status?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`
    );
    if (!testRes.ok) {
      res.status(400).json({ error: "Invalid WooCommerce credentials." });
      return;
    }

    await db.update(usersTable).set({
      wooCommerceUrl: cleanUrl,
      wooCommerceKey: consumerKey,
      wooCommerceSecret: consumerSecret,
    }).where(eq(usersTable.id, user.id));

    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Could not connect to WooCommerce store." });
  }
});

// GET /api/shopify/woocommerce/products
router.get("/woocommerce/products", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const user = await getDbUser(auth.userId!);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!user.wooCommerceUrl || !user.wooCommerceKey || !user.wooCommerceSecret) {
    res.status(400).json({ error: "WooCommerce not connected" });
    return;
  }

  const limit = Math.min(Number(req.query.per_page) || 20, 50);
  const search = req.query.search as string | undefined;

  try {
    const url = new URL(`${user.wooCommerceUrl}/wp-json/wc/v3/products`);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("consumer_key", user.wooCommerceKey);
    url.searchParams.set("consumer_secret", user.wooCommerceSecret);
    if (search) url.searchParams.set("search", search);

    const apiRes = await fetch(url.toString());
    if (!apiRes.ok) {
      res.status(502).json({ error: "Failed to fetch WooCommerce products" });
      return;
    }

    const wooProducts = await apiRes.json() as Array<{
      id: number;
      name: string;
      description: string;
      short_description: string;
      price: string;
      regular_price: string;
      categories: Array<{ name: string }>;
      tags: Array<{ name: string }>;
      images: Array<{ src: string }>;
    }>;

    const products = wooProducts.map((p) => ({
      id: String(p.id),
      title: p.name,
      description: (p.short_description || p.description).replace(/<[^>]+>/g, " ").trim().slice(0, 300),
      type: p.categories?.[0]?.name || "",
      tags: p.tags?.map((t) => t.name).join(", ") || "",
      price: p.price || p.regular_price,
      imageUrl: p.images?.[0]?.src,
    }));

    res.json({ products, connected: true, storeUrl: user.wooCommerceUrl });
  } catch {
    res.status(502).json({ error: "Failed to fetch WooCommerce products" });
  }
});

export default router;
