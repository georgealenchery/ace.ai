import { Router } from "express";
import type { Request, Response } from "express";
import { supabase } from "../services/supabase";

const router = Router();

// GET /api/interviews — all interviews for the logged-in user, newest first
router.get("/", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("interviews")
      .select("id, role, question_type, created_at, result")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Alias created_at → date for frontend compatibility
    const interviews = (data ?? []).map((r) => ({ ...r, date: r.created_at }));
    res.json({ interviews });
  } catch (err) {
    console.error("Error fetching interviews:", err);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// GET /api/interviews/:id — single interview (ownership enforced by .eq user_id)
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("interviews")
      .select("id, role, question_type, created_at, config, result, transcript")
      .eq("id", id)
      .eq("user_id", req.user!.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    res.json({ interview: { ...data, date: data.created_at } });
  } catch (err) {
    console.error("Error fetching interview:", err);
    res.status(500).json({ error: "Failed to fetch interview" });
  }
});

export default router;
