import express from "express";
import db from "#db/client";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM tracks");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching tracks:", err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Track ID must be a number" });
  }

  try {
    const { rows } = await db.query("SELECT * FROM tracks WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Track not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching track:", err);
    res.status(500).json({ error: "Failed to fetch track" });
  }
});

export default router;
