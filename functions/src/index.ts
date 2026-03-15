import { setGlobalOptions } from "firebase-functions/v2";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Limit concurrent containers to prevent unexpected cost spikes
 */
setGlobalOptions({ maxInstances: 10 });

/**
 * Block creation of brand-new Google accounts.
 * Only allow Google login if the provider was already linked
 * to an existing Firebase account from Settings.
 */
export const blockGoogleAccountCreation = beforeUserCreated((event) => {
  const provider = event.data?.providerData?.[0]?.providerId;

  if (provider === "google.com") {
    throw new HttpsError(
      "permission-denied",
      "Google login is only allowed after the account has been connected in Settings."
    );
  }

  return;
});
