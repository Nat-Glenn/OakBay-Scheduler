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
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/utils/UseMediaQuery";

export default function NavBarComp() {
  const router = useRouter();
  const { navState, handleOpen } = useNavBar();
  const { boolDark, handleBool } = useDarkMode();
  const path = usePathname();
  const small = useMediaQuery("(max-width: 768px)");

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
    <div className="flex flex-row items-center justify-center relative z-40 px-2 pr-4 pt-2 border-b border-muted-foreground/30">
      <Menu
        className="mr-auto hover:bg-muted-foreground/30 rounded-full p-2 cursor-pointer"
        onClick={handleOpen}
        size={40}
      />

      {small ? (
        <div className="mr-auto ml-auto text-xl font-bold text-center">
          {path === "/" ? "Scheduler" : path.split("/", 2)}
        </div>
      ) : (
        <div>&nbsp;</div>
      )}
      <div className="ml-auto">
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
      {navState !== "closed" && <MenuComp />}
    </div>
  );
}
