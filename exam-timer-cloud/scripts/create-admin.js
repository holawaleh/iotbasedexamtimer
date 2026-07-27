// One-off local script to create the first cloud admin account.
// Run locally (never deployed): node scripts/create-admin.js <username> <password>
// Requires DATABASE_URL to be set in your environment first, e.g.:
//   $env:DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"   (PowerShell)
//   node scripts/create-admin.js admin YourStrongPassword123

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const [,, username, password] = process.argv;

if (!username || !password) {
  console.error('Usage: node scripts/create-admin.js <username> <password>');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in your environment.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const existing = await sql`SELECT 1 FROM cloud_users WHERE username = ${username}`;
if (existing.length > 0) {
  console.log(`User "${username}" already exists. Updating password instead.`);
  await sql`UPDATE cloud_users SET password_hash = ${hashPassword(password)} WHERE username = ${username}`;
  console.log('Password updated.');
} else {
  await sql`
    INSERT INTO cloud_users (username, password_hash, role, status)
    VALUES (${username}, ${hashPassword(password)}, 'admin', 'active')
  `;
  console.log(`Admin user "${username}" created.`);
}
