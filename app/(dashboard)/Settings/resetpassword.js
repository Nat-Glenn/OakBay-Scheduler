import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase";

export async function sendAdminPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
  await signOut(auth);
}
