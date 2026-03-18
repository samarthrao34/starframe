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

5) Firebase Setup:
- Ensure `js/firebase-config.js` is correctly configured with your project's credentials.
- In the Firebase Console, add your Vercel deployment domain (e.g., `*.vercel.app`) to the "Authorized domains" list in the Authentication settings.
- Enable Cloud Firestore and Authentication (Email/Password and Google) in your Firebase project.

Notes:
- The site now uses Firebase for Authentication and Content Management, which is perfectly suited for Vercel's serverless environment.
- Traditional features like Socket.IO or SQLite won't work on Vercel; these have been replaced or augmented by Firebase.
- Environment variables for Payment (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) and Invoices should still be set in the Vercel dashboard.
