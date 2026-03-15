import { auth } from "@/app/Login/Firebase/firebase";
import { GoogleAuthProvider, linkWithPopup } from "firebase/auth";

export async function connectGoogleAccount() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user.");
  }

  const provider = new GoogleAuthProvider();

  const result = await linkWithPopup(user, provider);

  return result.user;
}

export function isGoogleConnected() {
  const user = auth.currentUser;
  if (!user) return false;

  return user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );
}
