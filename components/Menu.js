"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  GrMoney,
  GrPower,
  GrScorecard,
  GrSettingsOption,
  GrTask,
  GrUser,
  GrUserManager,
} from "react-icons/gr";
import { signOut } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase";
import { Menu } from "lucide-react";

export default function MenuComp({ closeNav }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/Login");
    } catch (err) {
      console.log(err);
      alert("Sign out failed.");
    }
  };

  const CurrentPage = (href) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");

    return `p-4 flex flex-row items-center gap-2 font-bold transition-all duration-200 ${
      isActive
        ? "bg-sidebar-button-primary hover:bg-sidebar-button-primary-foreground text-background shadow-inner border-r-4 border-[#A0CE66]"
        : "text-foreground hover:text-background bg-background hover:bg-sidebar-button-primary-foreground"
    }`;
  };

  return (
    <div
      onClick={closeNav}
      className="fixed inset-0 flex items-start animate-in fade-in-4 duration-200 bg-gray-700/60 z-2"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex flex-col animate-in slide-in-from-left-4 slide-out-from-left-4 duration-200 w-64 min-h-screen bg-background border-r border-white/5 shadow-2xl relative"
      >
        {/* Logo Section */}
        <div className="flex flex-row self-center items-center p-4 w-full">
          <Menu
            onClick={closeNav}
            size={40}
            className="mr-auto hover:bg-muted-foreground/30 p-2 rounded-full cursor-pointer"
          />
          <Image src="/logo.png" alt="Logo" width={100} height={50} priority />
          <div>&nbsp;</div>
        </div>

        {/* Navigation Links */}
        <Link
          href="/Appointments"
          onClick={closeNav}
          className={CurrentPage("/Appointments")}
        >
          <GrScorecard />
          Appointments
        </Link>

        <Link
          onClick={closeNav}
          href="/Billing"
          className={CurrentPage("/Billing")}
        >
          <GrMoney />
          Billing
        </Link>

        <Link
          onClick={closeNav}
          href="/Practitioners"
          className={CurrentPage("/Practitioners")}
        >
          <GrUserManager />
          Practitioners
        </Link>

        <Link
          onClick={closeNav}
          href="/Summary"
          className={CurrentPage("/Summary")}
        >
          <GrTask />
          Summary
        </Link>

        <Link
          href="/PatientProfiles"
          onClick={closeNav}
          className={CurrentPage("/PatientProfiles")}
        >
          <GrUser />
          Patient Profile
        </Link>

        <Link
          href="/Settings"
          onClick={closeNav}
          className={CurrentPage("/Settings")}
        >
          <GrSettingsOption />
          Settings
        </Link>

        {/* Sign Out Section */}
        <div className="mt-auto flex flex-row text-white justify-between font-bold border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex flex-1 flex-row items-center gap-2 p-4 bg-sidebar-button-primary hover:bg-sidebar-button-primary-foreground transition-all"
          >
            <GrPower />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
