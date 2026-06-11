import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const videoProjectsTable = pgTable("video_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  name: text("name").notNull(),
  script: text("script"),
  voiceoverJobId: integer("voiceover_job_id"),
  talkingHeadJobId: integer("talking_head_job_id"),
  brollJobIds: jsonb("broll_job_ids").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type VideoProject = typeof videoProjectsTable.$inferSelect;
export type InsertVideoProject = typeof videoProjectsTable.$inferInsert;
