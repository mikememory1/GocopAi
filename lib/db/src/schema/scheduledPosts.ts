import { pgTable, text, serial, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const scheduledPostStatusEnum = pgEnum("scheduled_post_status", [
  "pending",
  "publishing",
  "published",
  "failed",
  "cancelled",
]);

export const scheduledPostsTable = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  platforms: text("platforms").array().notNull(),
  caption: text("caption").notNull(),
  mediaObjectPath: text("media_object_path"),
  mediaType: text("media_type"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: scheduledPostStatusEnum("status").notNull().default("pending"),
  publishResults: jsonb("publish_results"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ScheduledPost = typeof scheduledPostsTable.$inferSelect;
export type NewScheduledPost = typeof scheduledPostsTable.$inferInsert;
