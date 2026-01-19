import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebase = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

export const firebaseApp = initializeFirebase();
export const firebaseAuth = admin.auth();

/**
 * Verify a Firebase ID token and return the decoded token
 */
export const verifyToken = async (
  idToken: string
): Promise<admin.auth.DecodedIdToken> => {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired Firebase token');
  }
};

/**
 * Get user info from Firebase by UID
 */
export const getUserByUid = async (
  uid: string
): Promise<admin.auth.UserRecord> => {
  try {
    return await firebaseAuth.getUser(uid);
  } catch (error) {
    throw new Error(`User not found: ${uid}`);
  }
};

/**
 * Link an anonymous account to email/password
 */
export const linkAnonymousAccount = async (
  uid: string,
  email: string
): Promise<admin.auth.UserRecord> => {
  try {
    return await firebaseAuth.updateUser(uid, { email });
  } catch (error) {
    throw new Error('Failed to link anonymous account');
  }
};

/**
 * Check if a user is anonymous
 */
export const isAnonymousUser = async (uid: string): Promise<boolean> => {
  const user = await getUserByUid(uid);
  // Anonymous users typically don't have email or phone
  return !user.email && !user.phoneNumber;
};
