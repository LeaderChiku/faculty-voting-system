import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { participantsTable, categoriesTable } from "@workspace/db/schema";
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
    photoUrl: r.photoUrl ?? null,
    orderIndex: r.orderIndex,
  })));
});

router.post("/", requireAdmin, async (req, res) => {
  const { name, gender, categoryId, photoUrl } = req.body;
  if (!name || !gender || !categoryId) return res.status(400).json({ error: "Required fields missing" });

  const countRows = await db.select({ cnt: sql<number>`count(*)` }).from(participantsTable).where(eq(participantsTable.categoryId, categoryId));
  const orderIndex = Number(countRows[0]?.cnt ?? 0);

  const [p] = await db.insert(participantsTable).values({
    name,
    gender,
    categoryId: parseInt(categoryId),
    photoUrl: photoUrl ?? null,
    orderIndex,
  }).returning();

  const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);

  res.status(201).json({
    id: p.id,
    name: p.name,
    gender: p.gender,
    categoryId: p.categoryId,
    categoryName: cat[0]?.name ?? "",
    photoUrl: p.photoUrl ?? null,
    orderIndex: p.orderIndex,
  });
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, gender, categoryId, photoUrl } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (gender !== undefined) updates.gender = gender;
  if (categoryId !== undefined) updates.categoryId = parseInt(categoryId);
  if (photoUrl !== undefined) updates.photoUrl = photoUrl ?? null;

  const [p] = await db.update(participantsTable).set(updates).where(eq(participantsTable.id, id)).returning();
  if (!p) return res.status(404).json({ error: "Not found" });

  const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);

  res.json({
    id: p.id,
    name: p.name,
    gender: p.gender,
    categoryId: p.categoryId,
    categoryName: cat[0]?.name ?? "",
    photoUrl: p.photoUrl ?? null,
    orderIndex: p.orderIndex,
  });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(participantsTable).where(eq(participantsTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
