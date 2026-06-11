import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const socialPlatformEnum = pgEnum("social_platform", [
  "linkedin",
  "facebook",
  "instagram",
  "threads",
  "twitter",
  "tiktok",
  "youtube",
  "telegram",
]);

export const socialAccountsTable = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  platform: socialPlatformEnum("platform").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  platformUserId: text("platform_user_id"),
  platformUsername: text("platform_username"),
  platformPageId: text("platform_page_id"),
  platformPageName: text("platform_page_name"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SocialAccount = typeof socialAccountsTable.$inferSelect;
