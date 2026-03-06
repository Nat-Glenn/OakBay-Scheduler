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
import { useNavBar } from "@/utils/NavBarProvider";

export default function MenuComp() {
  const { handleClose, navState, setNavState } = useNavBar();
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

    return `p-4 px-5 flex flex-row items-center gap-2 font-bold transition-all duration-200 ${
      isActive
        ? "bg-sidebar-button-primary hover:bg-sidebar-button-primary-foreground text-background shadow-inner border-r-4 border-[#A0CE66]"
        : "text-foreground hover:text-background bg-background hover:bg-sidebar-button-primary-foreground"
    }`;
  };

  return (
    <div
      onClick={handleClose}
      onAnimationEnd={(e) => {
        if (navState === "closing" && e.target === e.currentTarget) {
          setNavState("closed");
        }
      }}
      className={`fixed inset-0 duration-200 flex items-start bg-gray-700/60 z-2 will-change-transform
        ${
          navState === "open" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`flex flex-col w-64 min-h-screen bg-background border-r border-white/5 shadow-2xl relative transform transition-transform
          ${navState === "open" ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo Section */}
        <div className="flex flex-row self-center items-center py-2 px-2 w-full">
          <Menu
            onClick={handleClose}
            size={40}
            className="mr-auto hover:bg-muted-foreground/30 p-2 rounded-full cursor-pointer"
          />
          <Image src="/logo.png" alt="Logo" width={100} height={50} priority />
          <div>&nbsp;</div>
        </div>

        {/* Navigation Links */}
        <Link href="/" onClick={handleClose} className={CurrentPage("/")}>
          <GrScorecard />
          Appointments
        </Link>

        <Link
          onClick={handleClose}
          href="/Billing"
          className={CurrentPage("/Billing")}
        >
          <GrMoney />
          Billing
        </Link>

        <Link
          onClick={handleClose}
          href="/Practitioners"
          className={CurrentPage("/Practitioners")}
        >
          <GrUserManager />
          Practitioners
        </Link>

        <Link
          onClick={handleClose}
          href="/Summary"
          className={CurrentPage("/Summary")}
        >
          <GrTask />
          Summary
        </Link>

        <Link
          href="/PatientProfiles"
          onClick={handleClose}
          className={CurrentPage("/PatientProfiles")}
        >
          <GrUser />
          Patient Profile
        </Link>

        <Link
          href="/Settings"
          onClick={handleClose}
          className={CurrentPage("/Settings")}
        >
          <GrSettingsOption />
          Settings
        </Link>

        {/* Sign Out Section */}
        <div className="mt-auto flex flex-row text-white justify-between font-bold border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex flex-1 flex-row items-center gap-2 p-4 px-5 bg-sidebar-button-primary hover:bg-sidebar-button-primary-foreground transition-all"
          >
            <GrPower />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
