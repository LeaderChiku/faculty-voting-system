import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  participantsTable,
  categoriesTable,
  audienceVotesTable,
  facultyScoresTable,
  rampWalkStateTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAdmin(req: any, res: any, next: any) {
  const cookie = req.cookies?.auth_session;
  if (!cookie) return res.status(401).json({ error: "Not authenticated" });
  try {
    const session = JSON.parse(cookie);
    if (session.role !== "admin") return res.status(403).json({ error: "Admin only" });
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
}

router.get("/", async (req, res) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

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
    .where(categoryId ? eq(participantsTable.categoryId, categoryId) : sql`1=1`)
    .orderBy(participantsTable.orderIndex, participantsTable.id);

  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    gender: r.gender,
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? "",
    contestantNo: r.contestantNo,
    photoUrl: r.photoUrl ?? null,
    orderIndex: r.orderIndex,
  })));
});

router.post("/", requireAdmin, async (req, res) => {
  const { name, gender, categoryId, photoUrl, contestantNo: contestantNoRaw } = req.body;
  if (!name || !gender || !categoryId) return res.status(400).json({ error: "Required fields missing" });

  const countRows = await db.select({ cnt: sql<number>`count(*)` }).from(participantsTable).where(eq(participantsTable.categoryId, categoryId));
  const orderIndex = Number(countRows[0]?.cnt ?? 0);
  const maxContestantRows = await db.select({ maxNo: sql<number>`max(${participantsTable.contestantNo})` }).from(participantsTable);
  let contestantNo = Number(maxContestantRows[0]?.maxNo ?? 0) + 1;
  if (contestantNoRaw !== undefined && contestantNoRaw !== null && contestantNoRaw !== "") {
    const parsed = parseInt(contestantNoRaw);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ error: "Contestant number must be a positive integer" });
    }
    contestantNo = parsed;
  }

  let p: any;
  try {
    [p] = await db.insert(participantsTable).values({
      name,
      gender,
      categoryId: parseInt(categoryId),
      photoUrl: photoUrl ?? null,
      orderIndex,
      contestantNo,
    }).returning();
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(400).json({ error: "Contestant number already exists in this category" });
    }
    if (err?.code === "42703") {
      return res.status(500).json({ error: "Database schema is outdated. Please run database push/migration." });
    }
    return res.status(500).json({ error: err?.message ?? "Failed to save participant" });
  }

  const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);

  res.status(201).json({
    id: p.id,
    name: p.name,
    gender: p.gender,
    categoryId: p.categoryId,
    categoryName: cat[0]?.name ?? "",
    contestantNo: p.contestantNo,
    photoUrl: p.photoUrl ?? null,
    orderIndex: p.orderIndex,
  });
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, gender, categoryId, photoUrl, contestantNo: contestantNoRaw } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (gender !== undefined) updates.gender = gender;
  if (categoryId !== undefined) updates.categoryId = parseInt(categoryId);
  if (photoUrl !== undefined) updates.photoUrl = photoUrl ?? null;
  if (contestantNoRaw !== undefined && contestantNoRaw !== null && contestantNoRaw !== "") {
    const parsed = parseInt(contestantNoRaw);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ error: "Contestant number must be a positive integer" });
    }
    updates.contestantNo = parsed;
  }

  let p: any;
  try {
    [p] = await db.update(participantsTable).set(updates).where(eq(participantsTable.id, id)).returning();
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(400).json({ error: "Contestant number already exists in this category" });
    }
    if (err?.code === "42703") {
      return res.status(500).json({ error: "Database schema is outdated. Please run database push/migration." });
    }
    return res.status(500).json({ error: err?.message ?? "Failed to update participant" });
  }
  if (!p) return res.status(404).json({ error: "Not found" });

  const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);

  res.json({
    id: p.id,
    name: p.name,
    gender: p.gender,
    categoryId: p.categoryId,
    categoryName: cat[0]?.name ?? "",
    contestantNo: p.contestantNo,
    photoUrl: p.photoUrl ?? null,
    orderIndex: p.orderIndex,
  });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid participant id" });
  }

  const existing = await db
    .select({ id: participantsTable.id })
    .from(participantsTable)
    .where(eq(participantsTable.id, id))
    .limit(1);

  if (!existing[0]) {
    return res.status(404).json({ error: "Participant not found" });
  }

  // Remove dependent records first to satisfy FK constraints.
  await db.delete(audienceVotesTable).where(eq(audienceVotesTable.participantId, id));
  await db.delete(facultyScoresTable).where(eq(facultyScoresTable.participantId, id));
  await db
    .update(rampWalkStateTable)
    .set({ currentParticipantId: null })
    .where(eq(rampWalkStateTable.currentParticipantId, id));
  await db.delete(participantsTable).where(eq(participantsTable.id, id));

  res.json({ success: true, message: "Participant deleted" });
});

export default router;
