import crypto from 'crypto';
import { sql } from './db.js';

const SESSION_HOURS = 8;

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

export async function createSession(username, role) {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  await sql`
    INSERT INTO cloud_sessions (token, username, role, expires_at)
    VALUES (${token}, ${username}, ${role}, ${expiresAt.toISOString()})
  `;
  return { token, expiresAt };
}

export async function validateSession(token) {
  if (!token) return null;
  const rows = await sql`
    SELECT username, role, expires_at FROM cloud_sessions
    WHERE token = ${token}
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql`DELETE FROM cloud_sessions WHERE token = ${token}`;
    return null;
  }
  return { username: row.username, role: row.role };
}

export async function destroySession(token) {
  if (!token) return;
  await sql`DELETE FROM cloud_sessions WHERE token = ${token}`;
}

// Returns {username, role} or sends a 401 response and returns null.
export async function requireCloudAuth(req, res) {
  const cookies = parseCookies(req);
  const session = await validateSession(cookies.cloud_session);
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return session;
}

export async function requireCloudAdmin(req, res) {
  const session = await requireCloudAuth(req, res);
  if (!session) return null;
  if (session.role !== 'admin') {
    res.status(403).json({ error: 'admin only' });
    return null;
  }
  return session;
}

export async function requireCloudStaffOrAdmin(req, res) {
  const session = await requireCloudAuth(req, res);
  if (!session) return null;
  if (session.role === 'student') {
    res.status(403).json({ error: 'forbidden' });
    return null;
  }
  return session;
}
