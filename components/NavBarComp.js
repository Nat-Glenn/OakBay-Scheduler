"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../app/Login/Firebase/firebase";

import { useNavBar } from "@/utils/navBarProvider";
import MenuComp from "./Menu";

export default function NavBarComp() {
  const { boolClick } = useNavBar();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/Login");
        return;
      }

      await user.reload(); // makes emailVerified up-to-date
      if (!user.emailVerified) {
        router.replace("/Login");
        return;
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <div className="flex self-stretch">
      {boolClick && <MenuComp />}
    </div>
  );
}
