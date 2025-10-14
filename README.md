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
Place visual assets in `assets/screenshots/` and reference them in this README. Current placeholders expect:

- `assets/screenshots/homepage.png`
- `assets/screenshots/about.png`

Security and privacy
--------------------
- Do not commit passwords, private keys, or SMTP credentials to the repository.
- Ensure `SESSION_SECRET` and `INVOICE_JWT_SECRET` are set to strong, unguessable values in production.
- If the site accepts payments, use HTTPS and a proper payment provider with server-side webhook verification.

Contributing
------------
- Fork, branch, and open a pull request. Keep commits focused and include tests or screenshots when applicable.

License
-------
See the repository `LICENSE` file for license terms.

Contact
-------
For deployment or commercial inquiries: samarthrao34@gmail.com

![alt text](image.png)<<<<<<< HEAD
# starframe
Official website of Starframe Animation Studios
=======
# 🛡️ StarFrame Admin System

**A comprehensive admin dashboard system for monitoring and managing the StarFrame Animation Studio website with advanced security features, analytics, and real-time monitoring.**
# StarFrame Animation Studio — Website & Admin

This repository contains the StarFrame Animation Studio front-end website and an accompanying Node.js admin backend used for commissions, analytics, and administrative workflows.

This README has been rewritten to provide a clear, formal project overview and to include screenshots of the current site pages.

## Project overview

- Public static site built with HTML, CSS, and vanilla JavaScript.
- Admin and API routes implemented with Node.js and Express (in `server/`).
- Commission system with client-side invoice generation and server-side email support (serverless endpoints under `api/` for Vercel).

## Key features

- Commission form with service selection, budget ranges and payment options.
- Invoice generation and PDF emailing (via server or serverless functions).
- Admin dashboard and analytics routes (in `server/admin` and `server/routes`).
- Static portfolio pages and supporting assets (images, CSS, JS).

## Running locally (development)

Prerequisites: Node.js (14+), npm

1. Install dependencies:

```powershell
npm install
```

2. Start the server in development mode (uses `server/server.js`):

```powershell
npm run dev
```

Open `http://localhost:3001` in your browser and navigate to pages such as `/commission.html`.

Notes:
- Environment variables are used for session secrets and SMTP credentials. See `VERCEL_README.md` for production / Vercel guidance.

## Deployment

You can deploy the static site and serverless endpoints to Vercel (a `vercel.json` has been added). For larger, stateful server deployments consider Render, Railway, or a VPS.

## Screenshots

The repository README previously referenced in-repo image files. Those have been removed from this section and replaced with two dedicated screenshot slots. Please add the actual screenshot image files to `assets/screenshots/` with the filenames below so they render here.

Recommended filenames:

- `assets/screenshots/homepage.png`  — homepage / hero section
- `assets/screenshots/about.png`     — about / philosophy section

Once those files exist in the repository the images below will display automatically:

![Homepage](assets/screenshots/homepage.png)
![About section](assets/screenshots/about.png)

If you'd like, I can help capture live screenshots of running pages and add them into `assets/screenshots/` for you — let me know if you want me to do that (I can run a headless browser locally and push the generated images).

## Contributing

If you'd like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Open a pull request describing the change.

Please avoid committing large binaries (build artifacts or node_modules). Consider adding entries to `.gitignore` to keep the repository clean.

## License

This project is provided under the terms in the repository `LICENSE` file.

## Contact

For questions or to request help with deployment, email: samarthrao34@gmail.com
