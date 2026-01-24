import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";

const hasFirebaseConfig =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseConfig && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
} else if (!hasFirebaseConfig) {
  console.warn("⚠️  Firebase credentials not configured. Auth will not work.");
  console.warn("   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env");
}

export const firebaseAuth: Auth | null = hasFirebaseConfig ? admin.auth() : null;
export const firebaseAdmin = admin;
