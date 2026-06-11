import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const videoJobsTable = pgTable("video_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  jobType: text("job_type").notNull(),
  status: text("status").notNull().default("pending"),
  inputText: text("input_text").notNull(),
  outputUrl: text("output_url"),
  externalJobId: text("external_job_id"),
  metadata: jsonb("metadata"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type VideoJob = typeof videoJobsTable.$inferSelect;
export type InsertVideoJob = typeof videoJobsTable.$inferInsert;
