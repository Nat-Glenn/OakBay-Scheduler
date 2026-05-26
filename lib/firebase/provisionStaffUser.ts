/**
 * Creates or updates Firebase Authentication users for clinic staff (demo flow).
 * No invite emails — uses a shared demo password and marks email verified for login.
 */

import { getFirebaseAdminAuth } from "@/lib/authGuard";

/**
 * Demo-only default. Override with DEMO_STAFF_PASSWORD in .env.local.
 * Do not use a shared weak password in production — use invites or SSO instead.
 */
export const DEMO_STAFF_PASSWORD =
  process.env.DEMO_STAFF_PASSWORD?.trim() || "123456";

function isFirebaseAuthError(
  err: unknown,
  code: string,
): err is { code: string; message?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}

export function firebaseProvisionErrorMessage(err: unknown): string {
  if (isFirebaseAuthError(err, "auth/invalid-email")) {
    return "Invalid email address for login.";
  }
  if (isFirebaseAuthError(err, "auth/invalid-password")) {
    return "Demo password does not meet Firebase policy. Adjust DEMO_STAFF_PASSWORD.";
  }
  if (isFirebaseAuthError(err, "auth/email-already-exists")) {
    return "This email is already registered for login.";
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Failed to configure Firebase login for this user.";
}

/**
 * Ensures a Firebase user exists for the email with the demo password.
 * If the account already exists, updates password and display name.
 */
export async function provisionStaffAuthUser(params: {
  email: string;
  name?: string;
}): Promise<{ uid: string }> {
  const auth = getFirebaseAdminAuth();
  const email = params.email.trim().toLowerCase();
  const displayName = params.name?.trim() || undefined;

  try {
    const created = await auth.createUser({
      email,
      password: DEMO_STAFF_PASSWORD,
      displayName,
      emailVerified: true,
    });
    return { uid: created.uid };
  } catch (err) {
    if (!isFirebaseAuthError(err, "auth/email-already-exists")) {
      throw err;
    }

    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, {
      password: DEMO_STAFF_PASSWORD,
      displayName: displayName ?? existing.displayName ?? undefined,
      emailVerified: true,
    });
    return { uid: existing.uid };
  }
}

export async function deleteStaffAuthUser(uid: string): Promise<void> {
  try {
    await getFirebaseAdminAuth().deleteUser(uid);
  } catch (err) {
    console.warn("Failed to roll back Firebase user after DB error:", err);
  }
}

/**
 * When a clinic user's email changes, move or create the Firebase login to match.
 */
export async function syncStaffAuthEmailChange(params: {
  previousEmail: string;
  nextEmail: string;
  name?: string;
}): Promise<void> {
  const auth = getFirebaseAdminAuth();
  const previousEmail = params.previousEmail.trim().toLowerCase();
  const nextEmail = params.nextEmail.trim().toLowerCase();

  if (previousEmail === nextEmail) {
    return;
  }

  let previousRecord;
  try {
    previousRecord = await auth.getUserByEmail(previousEmail);
  } catch (err) {
    if (!isFirebaseAuthError(err, "auth/user-not-found")) {
      throw err;
    }
    await provisionStaffAuthUser({ email: nextEmail, name: params.name });
    return;
  }

  try {
    await auth.updateUser(previousRecord.uid, {
      email: nextEmail,
      password: DEMO_STAFF_PASSWORD,
      displayName: params.name?.trim() || previousRecord.displayName || undefined,
      emailVerified: true,
    });
  } catch (err) {
    if (!isFirebaseAuthError(err, "auth/email-already-exists")) {
      throw err;
    }

    const existing = await auth.getUserByEmail(nextEmail);
    await auth.updateUser(existing.uid, {
      password: DEMO_STAFF_PASSWORD,
      displayName: params.name?.trim() || existing.displayName || undefined,
      emailVerified: true,
    });
  }
}

/** Keeps Firebase display name / demo password in sync when email is unchanged. */
export async function syncStaffAuthProfile(params: {
  email: string;
  name?: string;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  const auth = getFirebaseAdminAuth();

  try {
    const record = await auth.getUserByEmail(email);
    await auth.updateUser(record.uid, {
      password: DEMO_STAFF_PASSWORD,
      displayName: params.name?.trim() || record.displayName || undefined,
      emailVerified: true,
    });
  } catch (err) {
    if (!isFirebaseAuthError(err, "auth/user-not-found")) {
      throw err;
    }
    await provisionStaffAuthUser({ email, name: params.name });
  }
}
