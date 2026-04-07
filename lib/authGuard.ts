import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin — only once across hot reloads
// Uses FIREBASE_SERVICE_ACCOUNT_JSON env variable (JSON string of service account)
function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. " +
      "Download your service account key from Firebase Console > Project Settings > Service Accounts."
    );
  }

  return initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
  });
}

// Verifies the Firebase ID token from the Authorization header
// Returns the decoded token (contains uid, email, role claims) or null if invalid
export async function verifyAuth(req: Request): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const adminApp = getAdminApp();
    const decoded = await getAuth(adminApp).verifyIdToken(token);

    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.error("Auth verification failed:", err);
    return null;
  }
}

// Convenience response for unauthenticated requests
export function unauthorized() {
  return Response.json(
    { error: "Unauthorized — valid Firebase token required" },
    { status: 401 }
  );
}