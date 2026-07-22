import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const DEVICE_SECRET = process.env.DEVICE_SECRET;

export default async function handler(req, res) {
  // GET: anyone can view current status (used by a public status page)
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM exam_state WHERE id = 1`;
    res.status(200).json(rows[0] || {});
    return;
  }

  // POST: only the ESP32 (with the shared secret) can push status updates
  if (req.method === 'POST') {
    const auth = req.headers['x-device-secret'];
    if (auth !== DEVICE_SECRET) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { state, remainingMs, durationMs, courseCode, message } = req.body;
    await sql`
      UPDATE exam_state SET
        state = ${state},
        remaining_ms = ${remainingMs},
        duration_ms = ${durationMs},
        course_code = ${courseCode},
        message = ${message},
        updated_at = now()
      WHERE id = 1
    `;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
