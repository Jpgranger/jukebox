import db from "./client.js";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  try {
    // Clear all tables (order matters because of foreign keys)
    await db.query(`DELETE FROM playlists_tracks`);
    await db.query(`DELETE FROM playlists`);
    await db.query(`DELETE FROM tracks`);

    // Seed 20 tracks
    const trackPromises = [];
    for (let i = 1; i <= 20; i++) {
      trackPromises.push(
        db.query(
          `INSERT INTO tracks (name, duration_ms) VALUES ($1, $2)`,
          [`Track ${i}`, Math.floor(Math.random() * 300000) + 60000] // 1–6 min
        )
      );
    }
    await Promise.all(trackPromises);

    // Seed 10 playlists
    const playlistPromises = [];
    for (let i = 1; i <= 10; i++) {
      playlistPromises.push(
        db.query(
          `INSERT INTO playlists (name, description) VALUES ($1, $2)`,
          [`Playlist ${i}`, `This is playlist number ${i}`]
        )
      );
    }
    await Promise.all(playlistPromises);

    // Seed 15 playlist-track associations
    const playlistTrackPromises = [];
    for (let i = 0; i < 15; i++) {
      const playlistId = Math.ceil(Math.random() * 10);
      const trackId = Math.ceil(Math.random() * 20);
      playlistTrackPromises.push(
        db.query(
          `INSERT INTO playlists_tracks (playlist_id, track_id)
           VALUES ($1, $2)
           ON CONFLICT (playlist_id, track_id) DO NOTHING`,
          [playlistId, trackId]
        )
      );
    }
    await Promise.all(playlistTrackPromises);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
  }
}
