import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

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

router.get("/", async (_req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  res.json(cats.map(c => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive,
    activeForVoting: c.activeForVoting,
  })));
});

router.post("/", requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const [cat] = await db.insert(categoriesTable).values({ name }).returning();
  res.status(201).json({
    id: cat.id,
    name: cat.name,
    isActive: cat.isActive,
    activeForVoting: cat.activeForVoting,
  });
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, isActive, activeForVoting } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (isActive !== undefined) updates.isActive = isActive;
  if (activeForVoting !== undefined) updates.activeForVoting = activeForVoting;
  const [cat] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!cat) return res.status(404).json({ error: "Not found" });
  res.json({
    id: cat.id,
    name: cat.name,
    isActive: cat.isActive,
    activeForVoting: cat.activeForVoting,
  });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
