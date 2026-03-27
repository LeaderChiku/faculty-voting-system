import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { rampWalkStateTable, participantsTable, categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function getSession(req: any) {
  const cookie = req.cookies?.auth_session;
  if (!cookie) return null;
  try { return JSON.parse(cookie); } catch { return null; }
}

async function getState() {
  const rows = await db.select().from(rampWalkStateTable).limit(1);
  if (rows.length === 0) {
    const [s] = await db.insert(rampWalkStateTable).values({ currentParticipantId: null }).returning();
    return s;
  }
  return rows[0];
}

async function buildParticipant(participantId: number | null) {
  if (!participantId) return null;
  const rows = await db
    .select({
      id: participantsTable.id,
      name: participantsTable.name,
      gender: participantsTable.gender,
      categoryId: participantsTable.categoryId,
      categoryName: categoriesTable.name,
      contestantNo: participantsTable.contestantNo,
      photoUrl: participantsTable.photoUrl,
      orderIndex: participantsTable.orderIndex,
    })
    .from(participantsTable)
    .leftJoin(categoriesTable, eq(participantsTable.categoryId, categoriesTable.id))
    .where(eq(participantsTable.id, participantId))
    .limit(1);

  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    gender: r.gender,
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? "",
    contestantNo: r.contestantNo,
    photoUrl: r.photoUrl ?? null,
    orderIndex: r.orderIndex,
  };
}

router.get("/current", async (_req, res) => {
  const state = await getState();
  const participant = await buildParticipant(state.currentParticipantId);
  res.json({
    currentParticipantId: state.currentParticipantId ?? null,
    isLive: state.isLive,
    ratingActive: state.ratingActive,
    participant,
  });
});

router.post("/next", async (req, res) => {
  const session = getSession(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const { participantId } = req.body;
  const state = await getState();

  const [updated] = await db
    .update(rampWalkStateTable)
    .set({ currentParticipantId: participantId ?? null, updatedAt: new Date() })
    .where(eq(rampWalkStateTable.id, state.id))
    .returning();

  const participant = await buildParticipant(updated.currentParticipantId);

  res.json({
    currentParticipantId: updated.currentParticipantId ?? null,
    isLive: updated.isLive,
    ratingActive: updated.ratingActive,
    participant,
  });
});

router.put("/settings", async (req, res) => {
  const session = getSession(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const { isLive, ratingActive } = req.body ?? {};
  const state = await getState();

  const updates: any = {};
  if (isLive !== undefined) updates.isLive = !!isLive;
  if (ratingActive !== undefined) updates.ratingActive = !!ratingActive;
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(rampWalkStateTable)
    .set(updates)
    .where(eq(rampWalkStateTable.id, state.id))
    .returning();

  const participant = await buildParticipant(updated.currentParticipantId);

  res.json({
    currentParticipantId: updated.currentParticipantId ?? null,
    isLive: updated.isLive,
    ratingActive: updated.ratingActive,
    participant,
  });
});

export default router;
