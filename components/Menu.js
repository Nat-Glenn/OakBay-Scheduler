/**
 * Mobile navigation drawer — slides in from the left on small screens.
 */

"use client";

import { Menu as MenuIcon } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import { useNavBar } from "@/utils/NavBarProvider";

export default function MobileMenuDrawer() {
  const { handleClose, navState, setNavState } = useNavBar();

  return (
    <div
      onClick={handleClose}
      onAnimationEnd={(e) => {
        if (navState === "closing" && e.target === e.currentTarget) {
          setNavState("closed");
        }
      }}
      className={`fixed inset-0 z-50 flex items-start bg-gray-700/60 duration-200 will-change-transform md:hidden ${
        navState === "open" ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative flex min-h-screen w-72 max-w-[85vw] transform flex-col border-r border-white/5 bg-background shadow-2xl transition-transform ${
          navState === "open" ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-muted-foreground/20 px-3 py-2">
          <button
            type="button"
            aria-label="Close menu"
            onClick={handleClose}
            className="rounded-full p-2 hover:bg-muted"
          >
            <MenuIcon size={28} />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarNav onNavigate={handleClose} />
        </div>
      </div>
    </div>
  );
}
