import express from "express";
import db from "#db/client";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM playlists");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching playlists:", err);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

router.post("/", async (req, res) => {
  const { name, description } = req.body || {};

  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }

  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required" });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO playlists (name, description)
       VALUES ($1, $2) RETURNING *`,
      [name, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating playlist:", err);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Playlist ID must be a number" });
  }

  try {
    const { rows } = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching playlist:", err);
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
});

router.get("/:id/tracks", async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Playlist ID must be a number" });
  }

  try {
    const playlistResult = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const { rows } = await db.query(
      `
      SELECT tracks.*
      FROM tracks
      JOIN playlists_tracks ON playlists_tracks.track_id = tracks.id
      WHERE playlists_tracks.playlist_id = $1
      `,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching playlist tracks:", err);
    res.status(500).json({ error: "Failed to fetch tracks for playlist" });
  }
});

router.post("/:id/tracks", async (req, res) => {
  const { id } = req.params;
  const { trackId } = req.body || {};

  if (isNaN(id)) {
    return res.status(400).json({ error: "Playlist ID must be a number" });
  }

  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }

  if (!trackId || isNaN(trackId)) {
    return res.status(400).json({ error: "trackId must be a valid number" });
  }

  try {
    const playlistCheck = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const trackCheck = await db.query("SELECT * FROM tracks WHERE id = $1", [trackId]);
    if (trackCheck.rows.length === 0) {
      return res.status(400).json({ error: "Track not found" });
    }

    const { rows } = await db.query(
      `INSERT INTO playlists_tracks (playlist_id, track_id)
       VALUES ($1, $2)
       ON CONFLICT (playlist_id, track_id) DO NOTHING
       RETURNING *`,
      [id, trackId]
    );

    if (rows.length === 0) {
        return res.status(400).json({ error: "Track already in playlist" });
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error adding track to playlist:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
