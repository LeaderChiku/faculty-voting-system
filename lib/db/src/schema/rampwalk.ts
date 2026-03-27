import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { participantsTable } from "./participants";

export const rampWalkStateTable = pgTable("ramp_walk_state", {
  id: serial("id").primaryKey(),
  currentParticipantId: integer("current_participant_id").references(() => participantsTable.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type RampWalkState = typeof rampWalkStateTable.$inferSelect;
