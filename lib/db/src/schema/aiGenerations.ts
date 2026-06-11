import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const aiGenerationsTable = pgTable("ai_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  toolType: text("tool_type").notNull(),
  inputSummary: text("input_summary").notNull(),
  output: text("output").notNull(),
  tokensEstimate: integer("tokens_estimate"),
  creditsUsed: numeric("credits_used", { precision: 6, scale: 2 }).notNull().default("1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiGenerationSchema = createInsertSchema(aiGenerationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAiGeneration = z.infer<typeof insertAiGenerationSchema>;
export type AiGeneration = typeof aiGenerationsTable.$inferSelect;
