import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  participantsTable,
  categoriesTable,
  audienceVotesTable,
  facultyScoresTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function scoreToVotes(score: number): number {
  return score * 5;
}

async function computeResults() {
  const participants = await db
    .select({
      id: participantsTable.id,
      name: participantsTable.name,
      photoUrl: participantsTable.photoUrl,
      categoryId: participantsTable.categoryId,
      categoryName: categoriesTable.name,
      contestantNo: participantsTable.contestantNo,
    })
    .from(participantsTable)
    .leftJoin(categoriesTable, eq(participantsTable.categoryId, categoriesTable.id));

  const audienceVoteCounts = await db
    .select({
      participantId: audienceVotesTable.participantId,
      count: sql<number>`count(*)::int`,
    })
    .from(audienceVotesTable)
    .groupBy(audienceVotesTable.participantId);

  const audienceMap = new Map(audienceVoteCounts.map(r => [r.participantId, Number(r.count)]));

  // Compute faculty votes + average rating based on scores that are actually submitted (>0).
  const facultyRows = await db
    .select({
      participantId: facultyScoresTable.participantId,
      scoreIntroduction: facultyScoresTable.scoreIntroduction,
      scoreRampwalk: facultyScoresTable.scoreRampwalk,
      scoreTalent: facultyScoresTable.scoreTalent,
    })
    .from(facultyScoresTable);

  const facultyAgg = new Map<number, { facultyVotes: number; ratingSum: number; ratingCount: number; facultyScoreCount: number }>();
  for (const r of facultyRows) {
    const cur = facultyAgg.get(r.participantId) ?? { facultyVotes: 0, ratingSum: 0, ratingCount: 0, facultyScoreCount: 0 };
    const intro = Number(r.scoreIntroduction ?? 0);
    const ramp = Number(r.scoreRampwalk ?? 0);
    const talent = Number(r.scoreTalent ?? 0);

    cur.facultyVotes += scoreToVotes(intro) + scoreToVotes(ramp) + scoreToVotes(talent);

    for (const s of [intro, ramp, talent]) {
      if (s > 0) {
        cur.ratingSum += s;
        cur.ratingCount += 1;
      }
    }

    // Count of faculty submissions (rows) for this participant.
    cur.facultyScoreCount += 1;
    facultyAgg.set(r.participantId, cur);
  }

  return participants.map(p => {
    const audienceVotes = audienceMap.get(p.id) ?? 0;
    const fd = facultyAgg.get(p.id);
    const facultyVotes = fd?.facultyVotes ?? 0;
    const totalVotes = audienceVotes + facultyVotes;
    return {
      participantId: p.id,
      name: p.name,
      photoUrl: p.photoUrl ?? null,
      categoryId: p.categoryId,
      categoryName: p.categoryName ?? "",
      contestantNo: p.contestantNo,
      facultyVotes,
      audienceVotes,
      totalVotes,
      averageRating: fd && fd.ratingCount > 0 ? (fd.ratingSum / fd.ratingCount) : null,
      facultyScoreCount: fd?.facultyScoreCount ?? 0,
    };
  });
}

router.get("/", async (_req, res) => {
  const results = await computeResults();
  const sorted = results.sort((a, b) => b.totalVotes - a.totalVotes);
  const top3 = sorted.slice(0, 3);
  res.json({ top3 });
});

router.get("/all", async (_req, res) => {
  const results = await computeResults();
  const sorted = results.sort((a, b) => b.totalVotes - a.totalVotes);
  res.json(sorted);
});

export default router;
