import { sql } from '../_lib/db.js';
import { requireCloudStaffOrAdmin } from '../_lib/auth.js';

const DEVICE_SECRET = process.env.DEVICE_SECRET;

export default async function handler(req, res) {
  // GET: the ESP32 polls this to fetch (and consume) the oldest pending command
  if (req.method === 'GET') {
    const auth = req.headers['x-device-secret'];
    if (auth !== DEVICE_SECRET) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const rows = await sql`
      SELECT * FROM pending_commands
      WHERE consumed = false
      ORDER BY created_at ASC
      LIMIT 1
    `;
    if (rows.length === 0) {
      res.status(200).json({ command: null });
      return;
    }
    const cmd = rows[0];
    await sql`UPDATE pending_commands SET consumed = true WHERE id = ${cmd.id}`;
    res.status(200).json({ command: cmd.command, params: cmd.params });
    return;
  }

  // POST: queue a new command - now requires cloud auth (staff/admin only),
  // closing the previously-open write access.
  if (req.method === 'POST') {
    const session = await requireCloudStaffOrAdmin(req, res);
    if (!session) return;

    const { command, params } = req.body || {};
    if (!command) {
      res.status(400).json({ error: 'missing command' });
      return;
    }
    await sql`
      INSERT INTO pending_commands (command, params)
      VALUES (${command}, ${JSON.stringify(params || {})})
    `;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
