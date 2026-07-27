import { parseCookies, destroySession } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const cookies = parseCookies(req);
  await destroySession(cookies.cloud_session);
  res.setHeader('Set-Cookie', 'cloud_session=; Path=/; Max-Age=0');
  res.status(200).json({ ok: true });
}
