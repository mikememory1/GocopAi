import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { aiGenerationsTable } from "./aiGenerations";

export const generationFeedbackTable = pgTable("generation_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  generationId: integer("generation_id").references(() => aiGenerationsTable.id).notNull(),
  rating: text("rating").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GenerationFeedback = typeof generationFeedbackTable.$inferSelect;
export type InsertGenerationFeedback = typeof generationFeedbackTable.$inferInsert;
