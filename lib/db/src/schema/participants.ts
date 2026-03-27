import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const participantsTable = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender").notNull().default("other"),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  // Global contestant number (primary display key across all categories).
  contestantNo: integer("contestant_no").notNull(),
  photoUrl: text("photo_url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  uniqContestantNoGlobal: uniqueIndex("uniq_participant_contestant_no").on(t.contestantNo),
}));

export const insertParticipantSchema = createInsertSchema(participantsTable).omit({ id: true, createdAt: true });
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participantsTable.$inferSelect;
