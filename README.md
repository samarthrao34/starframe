# StarFrame Animation Studio — Website & Admin


This repository contains the StarFrame public website (static HTML/CSS/JS) and an optional Node.js admin/API backend used for commissions and administrative workflows.

Overview
--------
- Static public site: HTML, CSS, and JavaScript (top-level HTML files).
- Optional backend: Express-based admin/API server located under `server/` (used for authenticated admin routes, commission persistence, and internal utilities).
- Serverless support: small API handlers suitable for Vercel are present under `api/` (invoice token and emailing handlers).

Highlights
----------
- Commission intake form with pricing and payment options.
- Invoice generation (client-side PDF) and server/serverless email delivery.
- Admin routes and basic analytics utilities (see `server/routes/`).

Quick start (development)
-------------------------
1. Install dependencies:

```powershell
npm install
```

2. Run in development mode:

```powershell
npm run dev
```

3. Visit the site locally:

Open `http://localhost:3001` and test pages such as `/commission.html`.

Configuration / Environment
---------------------------
Set these environment variables for production use (examples):

- `SESSION_SECRET` — strong secret for session cookies
- `INVOICE_JWT_SECRET` — signing secret for short-lived invoice tokens
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` — SMTP settings for invoice emails

For Vercel deployment, add the same variables in the project settings.

Deployment
----------
- Vercel: static files + serverless `api/` functions work out-of-the-box (see `vercel.json`).
- Alternatives for a full server: Render, Railway, or a VPS (Docker-friendly).

APIs / Endpoints
----------------
- `GET /api/invoice/token` — issues a short-lived token for sending invoices (serverless handler).
- `POST /api/invoice/send` — accepts HTML and recipient address; generates PDF and emails it (requires token).

Screenshots
-----------

![Homepage](assets/screenshots/homepage.png)
![About section](assets/screenshots/about.png)

If you'd like, I can help capture live screenshots of running pages and add them into `assets/screenshots/` for you — let me know if you want me to do that (I can run a headless browser locally and push the generated images).

Security and privacy
--------------------
- Do not commit passwords, private keys, or SMTP credentials to the repository.
- Ensure `SESSION_SECRET` and `INVOICE_JWT_SECRET` are set to strong, unguessable values in production.
- If the site accepts payments, use HTTPS and a proper payment provider with server-side webhook verification.

Contributing
------------
If you'd like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Open a pull request describing the change.

License
-------
See the repository `LICENSE` file for license terms.

Contact
-------
For deployment or commercial inquiries: samarthrao34@gmail.com





