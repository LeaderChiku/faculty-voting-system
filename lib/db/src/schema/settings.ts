import { pgTable, serial, boolean, integer, text, timestamp } from "drizzle-orm/pg-core";
import { categoriesTable } from "./categories";

export const eventSettingsTable = pgTable("event_settings", {
  id: serial("id").primaryKey(),
  votingOpen: boolean("voting_open").notNull().default(false),
  activeCategoryId: integer("active_category_id").references(() => categoriesTable.id),
  adminPasswordHash: text("admin_password_hash"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type EventSettings = typeof eventSettingsTable.$inferSelect;
