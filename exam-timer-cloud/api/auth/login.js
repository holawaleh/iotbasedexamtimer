import { sql } from '../../_lib/db.js';
import { verifyPassword } from '../../_lib/password.js';
import { createSession } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'missing credentials' });
    return;
  }

  const rows = await sql`SELECT * FROM cloud_users WHERE username = ${username}`;
  if (rows.length === 0) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }
  const user = rows[0];
  if (user.status === 'suspended') {
    res.status(401).json({ error: 'account suspended' });
    return;
  }
  if (!verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const { token, expiresAt } = await createSession(user.username, user.role);
  res.setHeader(
    'Set-Cookie',
    `cloud_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiresAt.toUTCString()}`
  );
  res.status(200).json({ ok: true, role: user.role });
}
