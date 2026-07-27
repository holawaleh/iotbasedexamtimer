import { sql } from '../_lib/db.js';
import { requireCloudAdmin } from '../_lib/auth.js';

const DEVICE_SECRET = process.env.DEVICE_SECRET;

export default async function handler(req, res) {
  // GET: cloud admin views the mirrored audit trail
  if (req.method === 'GET') {
    const session = await requireCloudAdmin(req, res);
    if (!session) return;
    const rows = await sql`
      SELECT time_str, username, action, details
      FROM cloud_logs
      ORDER BY id DESC
      LIMIT 200
    `;
    res.status(200).json(rows);
    return;
  }

  // POST: the ESP32 pushes its full local log as a mirror. Simplest correct
  // approach given the log is capped and small: replace the mirror wholesale
  // on each push rather than attempting incremental diff/dedup.
  if (req.method === 'POST') {
    const auth = req.headers['x-device-secret'];
    if (auth !== DEVICE_SECRET) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { logs } = req.body || {};
    if (!Array.isArray(logs)) {
      res.status(400).json({ error: 'logs must be an array' });
      return;
    }

    await sql`DELETE FROM cloud_logs`;
    for (const entry of logs) {
      await sql`
        INSERT INTO cloud_logs (time_str, username, action, details)
        VALUES (${entry.time || ''}, ${entry.user || ''}, ${entry.action || ''}, ${entry.details || ''})
      `;
    }
    res.status(200).json({ ok: true, count: logs.length });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
