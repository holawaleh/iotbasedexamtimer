import { sql } from '../_lib/db.js';
import { verifyPassword, hashPassword } from '../_lib/password.js';
import { requireCloudAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  const session = await requireCloudAuth(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword || newPassword.length < 4) {
    res.status(400).json({ error: 'invalid input' });
    return;
  }

  const rows = await sql`SELECT * FROM cloud_users WHERE username = ${session.username}`;
  if (rows.length === 0 || !verifyPassword(oldPassword, rows[0].password_hash)) {
    res.status(401).json({ error: 'current password incorrect' });
    return;
  }

  await sql`
    UPDATE cloud_users SET password_hash = ${hashPassword(newPassword)}
    WHERE username = ${session.username}
  `;
  res.status(200).json({ ok: true });
}
