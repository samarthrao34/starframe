# Firebase Setup (Auth + Live Content)

This project now supports:
- Email/password authentication for users
- Admin authentication by email (`samarthrao34@gmail.com`)
- Real-time homepage content publishing via Firestore

## 1) Create Firebase project
1. Open Firebase Console.
2. Create a new project.
3. Enable Authentication -> Sign-in method -> Email/Password.
4. Create Firestore Database in production mode.

## 2) Create the admin account
In Authentication -> Users, create this user:
- Email: `samarthrao34@gmail.com`
- Password: your secure admin password

## 3) Configure website Firebase keys
Add this script before `js/firebase-config.js` in pages where you need auth:

```html
<script>
  window.STARFRAME_FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
</script>
```

## 4) Firestore security rules (recommended)
Use strict rules so only the admin email can publish site content.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.token.email == "samarthrao34@gmail.com";
    }

    match /users/{uid} {
      allow read, write: if isSignedIn() && request.auth.uid == uid;
    }

    match /siteContent/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## 5) Real-time publish behavior
- Admin updates from the admin panel are written to `siteContent/home`.
- Homepage listens to this document and updates hero content instantly for all users.

## 6) Deploy for global reflection
Deploy your updated build to your hosting (Vercel or your production host). Once deployed, Firestore updates reflect worldwide in real-time.

## 7) Configure Firebase Admin SDK on server
For secure server-side verification, set this environment variable in your deployment:

```text
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Notes:
- Keep it as a single-line JSON string.
- Never commit service-account JSON to source control.
- If a service-account key was shared publicly, rotate it immediately in Google Cloud IAM.

## 8) Backend Firebase auth endpoint
The server now supports:
- `POST /api/auth/firebase-login` with `{ "idToken": "..." }`

This endpoint verifies the Firebase ID token with Firebase Admin SDK and creates a secure server session.
