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

async function computeResults() {
  const participants = await db
    .select({
      id: participantsTable.id,
      name: participantsTable.name,
      photoUrl: participantsTable.photoUrl,
      categoryId: participantsTable.categoryId,
      categoryName: categoriesTable.name,
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

  const facultyData = await db
    .select({
      participantId: facultyScoresTable.participantId,
      totalConvertedVotes: sql<number>`sum(${facultyScoresTable.convertedVotes})::int`,
      avgScore: sql<number>`avg(${facultyScoresTable.score})::float`,
      scoreCount: sql<number>`count(*)::int`,
    })
    .from(facultyScoresTable)
    .groupBy(facultyScoresTable.participantId);

  const audienceMap = new Map(audienceVoteCounts.map(r => [r.participantId, Number(r.count)]));
  const facultyMap = new Map(facultyData.map(r => [r.participantId, {
    totalConvertedVotes: Number(r.totalConvertedVotes),
    avgScore: r.avgScore ? Number(r.avgScore) : null,
    scoreCount: Number(r.scoreCount),
  }]));

  return participants.map(p => {
    const audienceVotes = audienceMap.get(p.id) ?? 0;
    const fd = facultyMap.get(p.id);
    const facultyVotes = fd?.totalConvertedVotes ?? 0;
    const totalVotes = audienceVotes + facultyVotes;
    return {
      participantId: p.id,
      name: p.name,
      photoUrl: p.photoUrl ?? null,
      categoryId: p.categoryId,
      categoryName: p.categoryName ?? "",
      facultyVotes,
      audienceVotes,
      totalVotes,
      averageRating: fd?.avgScore ?? null,
      facultyScoreCount: fd?.scoreCount ?? 0,
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
