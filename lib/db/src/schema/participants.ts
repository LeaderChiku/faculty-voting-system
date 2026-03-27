import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const participantsTable = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender").notNull().default("other"),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  photoUrl: text("photo_url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertParticipantSchema = createInsertSchema(participantsTable).omit({ id: true, createdAt: true });
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participantsTable.$inferSelect;
