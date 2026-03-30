# Deploying StarFrame to Hostinger

This guide mirrors the current secure setup in this repository and is intended for Hostinger Node.js hosting or a VPS.

## Automatic Deploy From GitHub To Hostinger (FTP)

If your main website is served from Hostinger `public_html`, you can auto-deploy on every push.

1. Push this repository to GitHub.
2. In GitHub: `Settings -> Secrets and variables -> Actions -> New repository secret`.
3. Add these secrets:
  - `HOSTINGER_FTP_USERNAME` = `u582259281.starframeanimationstudios.com`
  - `HOSTINGER_FTP_PASSWORD` = your Hostinger FTP password
4. Ensure your deployment branch is `main` (or `master`).
5. Push a commit. GitHub Actions will run `.github/workflows/deploy-hostinger.yml` and upload to `/public_html/`.

The workflow uses server `147.93.99.197` and port `21` directly.

Notes:
- This FTP workflow is for static/public website deployment.
- It excludes backend/runtime folders like `server/` and `api/`.
- Never commit FTP passwords into repository files.

## 1. Prerequisites

- A Hostinger plan that supports Node.js apps (or a VPS).
- Node.js 18+ selected in Hostinger panel.
- Git access to this repository.

## 2. Upload Code

Use one of these methods:

- Git deploy in Hostinger panel.
- Upload project files with File Manager/SFTP.

After upload, ensure the project root contains package.json and server/server.js.

## 3. Install Dependencies

In Hostinger terminal (project root):

```bash
npm install --omit=dev
```

## 4. Configure Environment Variables

Add these values in Hostinger environment settings (or your server .env file):

Required (production):
- NODE_ENV=production
- PORT=3001 (or value assigned by Hostinger)
- SESSION_SECRET=<strong-random-secret>
- JWT_SECRET=<strong-random-secret>
- INVOICE_JWT_SECRET=<strong-random-secret>
- ADMIN_USERNAME=<your-admin-username>
- ADMIN_EMAIL=<your-admin-email>
- ADMIN_PASSWORD=<strong-admin-password>

Google OAuth / Drive (required if using those features):
- GOOGLE_CLIENT_ID=<google-client-id>
- GOOGLE_CLIENT_SECRET=<google-client-secret>
- GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
- GOOGLE_DRIVE_REFRESH_TOKEN=<drive-refresh-token>

Optional / feature-based:
- FIREBASE_SERVICE_ACCOUNT_JSON=<single-line-json>
- RAZORPAY_KEY_ID=<razorpay-key-id>
- RAZORPAY_KEY_SECRET=<razorpay-key-secret>
- EMAIL_SERVICE=gmail
- EMAIL_USER=<smtp-user>
- EMAIL_PASSWORD=<smtp-password>
- FRONTEND_URL=https://your-domain.com

## 5. Start Command

Set app startup command to:

```bash
npm start
```

This runs:

```bash
node server/server.js
```

## 6. First-Time Setup

Run setup once (only if required for fresh database initialization):

```bash
npm run setup
```

If the app is already initialized, do not rerun setup unless you intend to update/reset admin records.

## 7. File Persistence Notes

This project uses SQLite in data/ and sessions in data/sessions.db.

For Hostinger shared environments, verify that app storage persists across restarts. If storage is ephemeral on your plan, move SQLite to persistent disk/VPS storage.

## 8. Domain and SSL

- Point your domain to the Hostinger app.
- Enable SSL/TLS in Hostinger.
- Ensure your canonical domain is one of:
  - https://starframeanimationstudios.com
  - https://www.starframeanimationstudios.com

## 9. Post-Deploy Verification

Check these routes in browser:

- /
- /admin
- /api/health (if enabled)
- /api/drive/gallery/2d-animation (if Drive is configured)

Then verify logs for startup errors.

## 10. Security Follow-Up (Important)

Because previous credentials were exposed in local scripts/docs, rotate these immediately in production:

- Google Client Secret
- Google Drive Refresh Token
- Admin Password

Then update Hostinger env variables with the rotated values.
