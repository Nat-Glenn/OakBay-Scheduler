import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../Firebase/firebase";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const email = user.email?.toLowerCase().trim();

  if (!email) {
    await signOut(auth);
    throw new Error("No email found on this account.");
  }

  const allowedRef = doc(db, "allowedUsers", email);
  const allowedSnap = await getDoc(allowedRef);

  if (!allowedSnap.exists()) {
    await signOut(auth);
    throw new Error("This account is not registered.");
  }

  return user;
}
