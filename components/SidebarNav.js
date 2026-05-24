/**
 * Shared sidebar navigation links and sign-out action.
 * Used by the desktop sidebar and the mobile drawer.
 */

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
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDarkMode } from "@/utils/DarkModeProvider";
import { isNavActive, NAV_ITEMS } from "@/lib/navigation";

const NAV_ICONS = {
  "/": GrScorecard,
  "/Billing": GrMoney,
  "/Practitioners": GrUserManager,
  "/Patients": GrUser,
  "/Summary": GrTask,
  "/Settings": GrSettingsOption,
};

function ThemeToggle() {
  const { boolDark, handleBool } = useDarkMode();

  return (
    <div className="flex flex-row items-center justify-between gap-2 px-4 py-3 text-sm text-foreground">
      <span className="flex items-center gap-2 font-medium">
        {boolDark ? <Moon size={18} /> : <Sun size={18} />}
        {boolDark ? "Dark mode" : "Light mode"}
      </span>
      <Switch
        onClick={handleBool}
        id="sidebar-theme-toggle"
        defaultChecked={boolDark}
      />
    </div>
  );
}

export default function SidebarNav({ onNavigate, showThemeToggle = true }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/Login");
    } catch (err) {
      console.error(err);
      alert("Sign out failed.");
    }
  };

  const linkClass = (href) => {
    const active = isNavActive(pathname, href);
    return `p-3 px-4 mx-2 rounded-lg flex flex-row items-center gap-3 font-semibold text-sm transition-colors ${
      active
        ? "bg-sidebar-button-primary text-background shadow-sm"
        : "text-foreground hover:bg-muted hover:text-foreground"
    }`;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col items-center border-b border-muted-foreground/20 px-4 py-5">
        <Image src="/logo.png" alt="Oak Bay Scheduler" width={120} height={60} priority />
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Clinic Scheduler
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-4">
        {NAV_ITEMS.map(({ href, label }) => {
          const Icon = NAV_ICONS[href];
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={linkClass(href)}
            >
              {Icon ? <Icon size={18} /> : null}
              {label}
            </Link>
          );
        })}
      </nav>

      {showThemeToggle ? (
        <div className="border-t border-muted-foreground/20">
          <ThemeToggle />
        </div>
      ) : null}

      <div className="border-t border-muted-foreground/20 p-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full flex-row items-center gap-3 rounded-lg bg-sidebar-button-primary p-3 px-4 text-sm font-semibold text-background transition-colors hover:bg-sidebar-button-primary-foreground"
        >
          <GrPower size={18} />
          Sign out
        </button>
      </div>
    </div>
  );
}
