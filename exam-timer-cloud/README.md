# Exam Timer Cloud Sync

Minimal Vercel + Neon backend for remote status view / remote commands.
Local (ESP32-hosted) dashboard remains the primary control path and keeps
working with zero dependency on this — this layer is purely additive.

## 1. Neon setup
1. Create a free account at neon.tech, create a new project.
2. Open the SQL editor, paste and run the contents of `schema.sql`.
3. Copy your connection string (Dashboard -> Connection Details).
   It looks like: `postgresql://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require`

## 2. Vercel setup
1. Create a free account at vercel.com.
2. Install the CLI: `npm i -g vercel`
3. From inside this folder, run: `vercel` (link/create a new project, accept defaults)
4. In the Vercel dashboard for this project, go to Settings -> Environment Variables
   and add:
   - `DATABASE_URL` = your Neon connection string from step 1.3
   - `DEVICE_SECRET` = any long random string you choose (e.g. a password
     generator output). This is what proves the ESP32 is allowed to write.
5. Redeploy: `vercel --prod`
6. Note the deployment URL, e.g. `https://exam-timer-cloud.vercel.app`

## 3. Give these two values back to your ESP32 firmware
- `CLOUD_API_BASE` = the Vercel URL from step 2.6 (no trailing slash)
- `DEVICE_SECRET` = the same value you set in step 2.4

These go into `platformio.ini` as build_flags (see cloud_sync integration notes).

## API summary
- `GET /api/status` - public read of current exam state (for a status page)
- `POST /api/status` - ESP32-only (requires `x-device-secret` header) push
- `GET /api/command` - ESP32-only poll for the next queued command
- `POST /api/command` - queue a command, e.g. `{"command":"start"}` or
  `{"command":"set","params":{"line1":"PHY201","duration":90}}`
