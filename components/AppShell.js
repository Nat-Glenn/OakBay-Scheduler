/**
 * Desktop-first app shell: persistent sidebar on md+ screens, mobile drawer on small screens.
 * Wraps authenticated pages with auth guard, navigation, and scrollable main content.
 */

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/Login/Firebase/firebase";
import { Menu, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import SidebarNav from "@/components/SidebarNav";
import MobileMenuDrawer from "@/components/Menu";
import { useNavBar } from "@/utils/NavBarProvider";
import { useDarkMode } from "@/utils/DarkModeProvider";
import { getPageTitle } from "@/lib/navigation";
import { isAuthSkippedClient } from "@/utils/authConfig";
import { useSessionUser } from "@/utils/useSessionUser";
import { canAccessRoute } from "@/lib/auth/permissions";

function MobileTopBar({ title, onOpenMenu }) {
  const { boolDark, handleBool } = useDarkMode();

  return (
    <header className="flex shrink-0 flex-row items-center gap-2 border-b border-muted-foreground/30 px-2 py-2 md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onOpenMenu}
        className="rounded-full p-2 hover:bg-muted"
      >
        <Menu size={28} />
      </button>
      <h1 className="flex-1 truncate text-center text-lg font-bold">{title}</h1>
      <div className="flex items-center gap-1 pr-1">
        {boolDark ? <Moon size={16} /> : <Sun size={16} />}
        <Switch onClick={handleBool} defaultChecked={boolDark} />
      </div>
    </header>
  );
}

export default function AppShell({ children, title }) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = title ?? getPageTitle(pathname);
  const { navState, handleOpen } = useNavBar();
  const { session, loading: sessionLoading } = useSessionUser();

  useEffect(() => {
    if (isAuthSkippedClient()) return;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/Login");
        return;
      }

      await user.reload();
      if (!user.emailVerified) {
        router.replace("/Login");
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (sessionLoading || !session?.role) return;
    if (!canAccessRoute(pathname, session.role)) {
      router.replace("/");
    }
  }, [pathname, session, sessionLoading, router]);

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-muted-foreground/30 bg-background md:flex">
        <SidebarNav />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileTopBar title={pageTitle} onOpenMenu={handleOpen} />
        {navState !== "closed" ? <MobileMenuDrawer /> : null}

        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden text-foreground">
          {children}
        </div>
      </div>
    </main>
  );
}
