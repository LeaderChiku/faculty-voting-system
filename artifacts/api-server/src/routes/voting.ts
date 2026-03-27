import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  eventSettingsTable,
  audienceVotesTable,
  facultyScoresTable,
  categoriesTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function scoreToVotes(score: number): number {
  return score * 5;
}

function getSession(req: any) {
  const cookie = req.cookies?.auth_session;
  if (!cookie) return null;
  try { return JSON.parse(cookie); } catch { return null; }
}

async function getSettings() {
  const rows = await db.select().from(eventSettingsTable).limit(1);
  if (rows.length === 0) {
    const [s] = await db.insert(eventSettingsTable).values({ votingOpen: false }).returning();
    return s;
  }
  return rows[0];
}

router.get("/status", async (_req, res) => {
  const settings = await getSettings();
  let categoryName: string | null = null;
  if (settings.activeCategoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, settings.activeCategoryId)).limit(1);
    categoryName = cats[0]?.name ?? null;
  }
  res.json({
    isOpen: settings.votingOpen,
    activeCategoryId: settings.activeCategoryId ?? null,
    activeCategoryName: categoryName,
  });
});

router.put("/status", async (req, res) => {
  const session = getSession(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const { isOpen, activeCategoryId } = req.body;
  const settings = await getSettings();

  const [updated] = await db
    .update(eventSettingsTable)
    .set({ votingOpen: isOpen, activeCategoryId: activeCategoryId ?? null })
    .where(eq(eventSettingsTable.id, settings.id))
    .returning();

  let categoryName: string | null = null;
  if (updated.activeCategoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated.activeCategoryId)).limit(1);
    categoryName = cats[0]?.name ?? null;
  }

  res.json({
    isOpen: updated.votingOpen,
    activeCategoryId: updated.activeCategoryId ?? null,
    activeCategoryName: categoryName,
  });
});

router.post("/audience", async (req, res) => {
  const session = getSession(req);
  if (!session || session.role !== "audience") return res.status(403).json({ error: "Audience only" });

  const settings = await getSettings();
  if (!settings.votingOpen) return res.status(400).json({ error: "Voting is not open" });

  const { participantId, categoryId } = req.body;
  if (!participantId || !categoryId) return res.status(400).json({ error: "participantId and categoryId required" });

  const sessionId = session.username;
  const deviceId = req.cookies?.audience_device_id as string | undefined;
  if (!deviceId) return res.status(400).json({ error: "Device not registered. Please login again." });

  const existing = await db
    .select()
    .from(audienceVotesTable)
    .where(and(
      eq(audienceVotesTable.categoryId, parseInt(categoryId)),
      eq(audienceVotesTable.deviceId, deviceId),
    ))
    .limit(1);

  if (existing.length > 0) {
    return res.status(400).json({ error: "You have already voted in this category from this device" });
  }

  try {
    await db.insert(audienceVotesTable).values({
      sessionId,
      deviceId,
      participantId: parseInt(participantId),
      categoryId: parseInt(categoryId),
    });
  } catch (err: any) {
    // Postgres unique violation error code: 23505
    if (err?.code === "23505") {
      return res.status(400).json({ error: "You have already voted in this category from this device" });
    }
    throw err;
  }

  res.json({ success: true, message: "Vote recorded" });
});

router.post("/faculty", async (req, res) => {
  const session = getSession(req);
  if (!session || session.role !== "faculty") return res.status(403).json({ error: "Faculty only" });

  const settings = await getSettings();
  if (!settings.votingOpen) return res.status(400).json({ error: "Voting is not open" });

  const { participantId, scoreIntroduction, scoreRampwalk, scoreTalent } = req.body;
  if (!participantId) return res.status(400).json({ error: "participantId required" });

  const hasAny =
    scoreIntroduction != null ||
    scoreRampwalk != null ||
    scoreTalent != null;
  if (!hasAny) return res.status(400).json({ error: "At least one score is required" });

  const parseScore = (v: any) => (v == null ? null : parseInt(v));

  const intro = parseScore(scoreIntroduction);
  const ramp = parseScore(scoreRampwalk);
  const talent = parseScore(scoreTalent);

  for (const s of [intro, ramp, talent]) {
    if (s == null) continue;
    if (s < 1 || s > 5) return res.status(400).json({ error: "Each score must be 1-5" });
  }

  const facultyName = session.name ?? session.username;

  const existing = await db
    .select()
    .from(facultyScoresTable)
    .where(and(
      eq(facultyScoresTable.facultyName, facultyName),
      eq(facultyScoresTable.participantId, parseInt(participantId)),
    ))
    .limit(1);

  if (existing.length > 0) {
    const prev = existing[0];
    const nextIntro = intro ?? prev.scoreIntroduction;
    const nextRamp = ramp ?? prev.scoreRampwalk;
    const nextTalent = talent ?? prev.scoreTalent;
    const convertedVotes = scoreToVotes(nextIntro) + scoreToVotes(nextRamp) + scoreToVotes(nextTalent);

    await db
      .update(facultyScoresTable)
      .set({
        ...(intro != null ? { scoreIntroduction: intro } : {}),
        ...(ramp != null ? { scoreRampwalk: ramp } : {}),
        ...(talent != null ? { scoreTalent: talent } : {}),
        convertedVotes,
      })
      .where(eq(facultyScoresTable.id, existing[0].id));
    return res.json({ success: true, message: "Score updated" });
  }

  const firstIntro = intro ?? 0;
  const firstRamp = ramp ?? 0;
  const firstTalent = talent ?? 0;
  const convertedVotes = scoreToVotes(firstIntro) + scoreToVotes(firstRamp) + scoreToVotes(firstTalent);

  await db.insert(facultyScoresTable).values({
    facultyName,
    participantId: parseInt(participantId),
    ...(intro != null ? { scoreIntroduction: intro } : {}),
    ...(ramp != null ? { scoreRampwalk: ramp } : {}),
    ...(talent != null ? { scoreTalent: talent } : {}),
    convertedVotes,
  });

  res.json({ success: true, message: "Score recorded" });
});

export default router;
