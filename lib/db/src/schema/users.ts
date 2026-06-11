import { pgTable, text, serial, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  businessName: text("business_name"),
  website: text("website"),
  role: roleEnum("role").notNull().default("user"),
  credits: numeric("credits", { precision: 10, scale: 2 }).notNull().default("50"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPlan: text("current_plan"),
  planStatus: text("plan_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  shopifyStoreDomain: text("shopify_store_domain"),
  shopifyAccessToken: text("shopify_access_token"),
  wooCommerceUrl: text("woo_commerce_url"),
  wooCommerceKey: text("woo_commerce_key"),
  wooCommerceSecret: text("woo_commerce_secret"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
