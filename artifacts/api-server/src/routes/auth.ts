import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { eventSettingsTable } from "@workspace/db/schema";

const router: IRouter = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "kad2830";
const FACULTY_PASSWORD = process.env.FACULTY_PASSWORD ?? "faculty123";
const AUDIENCE_PASSWORD = process.env.AUDIENCE_PASSWORD ?? "audience123";

declare module "express-serve-static-core" {
  interface Request {
    session?: {
      role?: string;
      username?: string;
      name?: string;
    };
  }
}

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    (req as any).session = { role: "admin", username };
    res.cookie("auth_session", JSON.stringify({ role: "admin", username }), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",  // required for cross-origin (pages.dev → onrender.com)
      secure: true,      // required when sameSite=none
    });
    res.json({ role: "admin", username });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.post("/faculty/login", (req, res) => {
  const { name, password } = req.body;
  if (!name || !name.trim()) {
    return res.status(401).json({ error: "Name is required" });
  }
  if (password === FACULTY_PASSWORD) {
    const username = name.trim();
    res.cookie("auth_session", JSON.stringify({ role: "faculty", username, name: username }), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    res.json({ role: "faculty", username, name: username });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.post("/audience/login", (req, res) => {
  const { username } = req.body;
  if (!username || !username.trim()) {
    return res.status(401).json({ error: "Name is required" });
  }
  const uname = username.trim();

  // Stable device identifier to prevent revoting by changing name.
  let deviceId = req.cookies?.audience_device_id as string | undefined;
  if (!deviceId) {
    deviceId = uuidv4();
    res.cookie("audience_device_id", deviceId, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
  }

  res.cookie("auth_session", JSON.stringify({ role: "audience", username: uname, deviceId }), {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
  });
  res.json({ role: "audience", username: uname });
});

router.get("/me", (req, res) => {
  const cookie = req.cookies?.auth_session;
  if (!cookie) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const session = JSON.parse(cookie);
    if (!session.role) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(session);
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("auth_session", { sameSite: "none", secure: true });
  res.json({ success: true, message: "Logged out" });
});

export default router;
