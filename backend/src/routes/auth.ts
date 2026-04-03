import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { supabase } from "../services/supabase";

const router = Router();
const VALID_ROLES = new Set(["frontend", "backend", "fullstack"]);

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .eq("id", req.user!.id)
    .single();

  if (error || !data) {
    // Profile row may not exist yet for users who signed up before this migration
    res.json({ id: req.user!.id, email: req.user!.email });
    return;
  }
  res.json(data);
});

// PATCH /api/auth/me/role
router.patch("/me/role", authMiddleware, async (req: Request, res: Response) => {
  const { role } = req.body as { role?: string };
  if (!role || !VALID_ROLES.has(role)) {
    res.status(400).json({ error: "role must be one of: frontend, backend, fullstack" });
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", req.user!.id)
    .select("id, email, name, role")
    .single();

  if (error || !data) {
    res.status(500).json({ error: "Failed to update role" });
    return;
  }
  res.json(data);
});

export default router;
