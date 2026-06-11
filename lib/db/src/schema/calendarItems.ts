import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const calendarItemsTable = pgTable("calendar_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  brandProfileId: integer("brand_profile_id"),
  scheduledDate: text("scheduled_date").notNull(),
  platform: text("platform").notNull(),
  contentType: text("content_type").notNull().default("post"),
  title: text("title"),
  content: text("content"),
  status: text("status").notNull().default("draft"),
  generationId: integer("generation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type CalendarItem = typeof calendarItemsTable.$inferSelect;
export type InsertCalendarItem = typeof calendarItemsTable.$inferInsert;
