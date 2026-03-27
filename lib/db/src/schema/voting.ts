import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { participantsTable } from "./participants";
import { categoriesTable } from "./categories";

export const audienceVotesTable = pgTable("audience_votes", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  deviceId: text("device_id").notNull(),
  participantId: integer("participant_id").notNull().references(() => participantsTable.id),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  // Enforce: one audience vote per category per device.
  uniqAudienceVotePerCategoryPerDevice: uniqueIndex("uniq_audience_vote_category_device").on(t.categoryId, t.deviceId),
}));

export const facultyScoresTable = pgTable("faculty_scores", {
  id: serial("id").primaryKey(),
  facultyName: text("faculty_name").notNull(),
  participantId: integer("participant_id").notNull().references(() => participantsTable.id),
  // 0 means "not scored yet" (allows scoring in phases).
  scoreIntroduction: integer("score_introduction").notNull().default(0),
  scoreRampwalk: integer("score_rampwalk").notNull().default(0),
  scoreTalent: integer("score_talent").notNull().default(0),
  convertedVotes: integer("converted_votes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAudienceVoteSchema = createInsertSchema(audienceVotesTable).omit({ id: true, createdAt: true });
export type InsertAudienceVote = z.infer<typeof insertAudienceVoteSchema>;
export type AudienceVote = typeof audienceVotesTable.$inferSelect;

export const insertFacultyScoreSchema = createInsertSchema(facultyScoresTable).omit({ id: true, createdAt: true });
export type InsertFacultyScore = z.infer<typeof insertFacultyScoreSchema>;
export type FacultyScore = typeof facultyScoresTable.$inferSelect;
