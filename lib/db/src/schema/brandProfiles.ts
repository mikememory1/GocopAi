import { pgTable, serial, integer, text, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const brandProfilesTable = pgTable("brand_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  name: text("name").notNull(),
  industry: text("industry"),
  productDescription: text("product_description"),
  targetAudience: text("target_audience"),
  tone: text("tone").notNull().default("professional"),
  platforms: jsonb("platforms").$type<string[]>().notNull().default([]),
  brandValues: text("brand_values"),
  competitors: text("competitors"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type BrandProfile = typeof brandProfilesTable.$inferSelect;
export type InsertBrandProfile = typeof brandProfilesTable.$inferInsert;
