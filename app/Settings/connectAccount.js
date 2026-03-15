import { auth } from "@/app/Login/Firebase/firebase";
import {
  GoogleAuthProvider,
  linkWithPopup,
  unlink,
} from "firebase/auth";

export async function connectGoogleAccount() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user found.");
  }

  const alreadyLinked = user.providerData.some(
    (provider) => provider.providerId === "google.com",
  );

  if (alreadyLinked) {
    return user;
  }

  const provider = new GoogleAuthProvider();
  const result = await linkWithPopup(user, provider);

  return result.user;
}

export async function disconnectGoogleAccount() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user found.");
  }

  const hasGoogle = user.providerData.some(
    (provider) => provider.providerId === "google.com",
  );

  if (!hasGoogle) {
    throw new Error("Google account is not connected.");
  }

  const remainingProviders = user.providerData.filter(
    (provider) => provider.providerId !== "google.com",
  );

  if (remainingProviders.length === 0) {
    throw new Error(
      "You cannot disconnect Google because it is your only sign-in method.",
    );
  }

  await unlink(user, "google.com");
  return auth.currentUser;
}

export function isGoogleConnected() {
  const user = auth.currentUser;
  if (!user) return false;

  return user.providerData.some(
    (provider) => provider.providerId === "google.com",
  );
}