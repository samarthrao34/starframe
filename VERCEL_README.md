Deploying this project to Vercel (quick guide)

1) Sign into vercel.com and create a new project connected to this repository (or import the repo).

2) Environment variables (set in the Vercel dashboard -> Project -> Settings -> Environment Variables):
- INVOICE_JWT_SECRET: a strong random secret used to sign short-lived tokens
- EMAIL_USER: SMTP username (e.g. SMTP user or gmail address)
- EMAIL_PASS: SMTP password or app password
- EMAIL_FROM: optional From address for outgoing emails
- EMAIL_HOST (optional): SMTP host (defaults to smtp.gmail.com)
- EMAIL_PORT (optional): SMTP port (defaults to 587)
- EMAIL_SECURE (optional): 'true' to use secure connection (465)

3) Deploy. Static HTML/CSS/JS will be served directly; the API endpoints live under `/api/invoice/token` and `/api/invoice/send`.

4) Client-side: update the client to fetch `/api/invoice/token` on the deployed origin before calling `/api/invoice/send`.

Notes:
- Vercel serverless functions have execution time limits — sending an email with PDF generation should be fine on typical small invoices, but if you generate large PDFs or process heavy images, consider offloading to a background worker or external service.
- For production email, consider using a transactional email provider (SendGrid, Mailgun, Postmark) which integrates well with Vercel.
