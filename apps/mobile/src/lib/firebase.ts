/**
 * Simple auth module that generates a unique anonymous user ID.
 * For MVP - can be replaced with Firebase or other auth later.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "@brea/user_id";

interface User {
  uid: string;
  isAnonymous: boolean;
}

let currentUser: User | null = null;

/**
 * Generate a simple UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Initialize auth - creates or retrieves anonymous user
 */
export async function initAuth(): Promise<User | null> {
  try {
    // Check for existing user ID
    let userId = await AsyncStorage.getItem(USER_ID_KEY);

    if (!userId) {
      // Generate new anonymous user ID
      userId = generateUUID();
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      console.log("[Auth] Created new anonymous user:", userId);
    } else {
      console.log("[Auth] Found existing user:", userId);
    }

    currentUser = {
      uid: userId,
      isAnonymous: true,
    };

    return currentUser;
  } catch (error) {
    console.error("[Auth] Initialization failed:", error);
    return null;
  }
}

/**
 * Get current user (sync, returns cached value)
 */
export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * Get auth token - for MVP, just return the user ID
 * In production, this would be a JWT from your backend
 */
export async function getAuthToken(): Promise<string | null> {
  return currentUser?.uid ?? null;
}

/**
 * Sign out - clears the stored user ID
 */
export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(USER_ID_KEY);
  currentUser = null;
  console.log("[Auth] Signed out");
}
