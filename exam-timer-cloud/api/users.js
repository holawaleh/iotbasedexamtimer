import { sql } from '../_lib/db.js';
import { hashPassword } from '../_lib/password.js';
import { requireCloudAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const session = await requireCloudAdmin(req, res);
    if (!session) return;
    const rows = await sql`SELECT username, role, status FROM cloud_users ORDER BY username`;
    res.status(200).json(rows);
    return;
  }

  if (req.method === 'POST') {
    const session = await requireCloudAdmin(req, res);
    if (!session) return;

    const { action, username, password, role } = req.body || {};

    if (action === 'add') {
      if (!username || !password || password.length < 4) {
        res.status(400).json({ error: 'invalid input' });
        return;
      }
      const exists = await sql`SELECT 1 FROM cloud_users WHERE username = ${username}`;
      if (exists.length > 0) {
        res.status(409).json({ error: 'username already exists' });
        return;
      }
      await sql`
        INSERT INTO cloud_users (username, password_hash, role, status)
        VALUES (${username}, ${hashPassword(password)}, ${role || 'staff'}, 'active')
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'suspend') {
      await sql`UPDATE cloud_users SET status = 'suspended' WHERE username = ${username}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'activate') {
      await sql`UPDATE cloud_users SET status = 'active' WHERE username = ${username}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'remove') {
      if (username === session.username) {
        res.status(400).json({ error: 'cannot remove your own account' });
        return;
      }
      await sql`DELETE FROM cloud_users WHERE username = ${username}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'password') {
      if (!password || password.length < 4) {
        res.status(400).json({ error: 'password too short' });
        return;
      }
      await sql`
        UPDATE cloud_users SET password_hash = ${hashPassword(password)}
        WHERE username = ${username}
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: 'unknown action' });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
