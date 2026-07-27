import { sql } from '../_lib/db.js';
import { requireCloudAuth } from '../_lib/auth.js';

const DEVICE_SECRET = process.env.DEVICE_SECRET;
const OFFLINE_AFTER_SEC = 30; // no push in this window => considered offline

export default async function handler(req, res) {
  // GET: requires cloud login (dashboard reads its own status)
  if (req.method === 'GET') {
    const session = await requireCloudAuth(req, res);
    if (!session) return;

    const rows = await sql`SELECT * FROM exam_state WHERE id = 1`;
    const row = rows[0] || {};

    let connected = false;
    if (row.last_seen) {
      const ageSec = (Date.now() - new Date(row.last_seen).getTime()) / 1000;
      connected = ageSec <= OFFLINE_AFTER_SEC;
    }

    res.status(200).json({
      ...row,
      connected,
      you: session.username,
      role: session.role,
    });
    return;
  }

  // POST: only the ESP32 (device secret) pushes status
  if (req.method === 'POST') {
    const auth = req.headers['x-device-secret'];
    if (auth !== DEVICE_SECRET) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { state, remainingMs, durationMs, courseCode, message, queue } = req.body || {};
    await sql`
      UPDATE exam_state SET
        state = ${state},
        remaining_ms = ${remainingMs},
        duration_ms = ${durationMs},
        course_code = ${courseCode},
        message = ${message},
        queue_json = ${JSON.stringify(queue || [])},
        last_seen = now(),
        updated_at = now()
      WHERE id = 1
    `;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
