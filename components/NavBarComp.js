"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../app/Login/Firebase/firebase";
import MenuComp from "./Menu";
import { useNavBar } from "@/utils/NavBarProvider";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { Switch } from "./ui/switch";
import { useDarkMode } from "@/utils/DarkModeProvider";

export default function NavBarComp() {
  const router = useRouter();
  const { boolOpen, handleOpen } = useNavBar();
  const { boolDark, handleBool } = useDarkMode();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/Login");
        return;
      }

      await user.reload();
      if (!user.emailVerified) {
        router.replace("/Login");
        return;
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <div className="flex flex-row items-center justify-center relative z-40">
      <Menu
        onClick={handleOpen}
        size={40}
        className="mr-auto hover:bg-muted-foreground/30 p-2 rounded-full cursor-pointer"
      />
      <div>&nbsp;</div>
      <div className="">
        {boolDark ? (
          <div className="flex flex-row gap-2 items-center">
            <Moon />
            <Switch onClick={handleBool} id="switchDark" defaultChecked />
          </div>
        ) : (
          <div className="flex flex-row gap-2 items-center">
            <Sun />
            <Switch onClick={handleBool} id="switchDark" />
          </div>
        )}
      </div>
      {boolOpen && <MenuComp closeNav={handleOpen} />}
    </div>
  );
}
