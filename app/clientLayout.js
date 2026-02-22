"use client";
import { useEffect } from "react";
import { useDarkMode } from "@/utils/DarkModeProvider";
import { Toaster } from "@/components/ui/sonner";

export default function ClientLayout({ children }) {
  const { boolDark } = useDarkMode();

  useEffect(() => {
    const root = document.documentElement;
    if (boolDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [boolDark]);

  return (
    <div className="h-dvh">
      <Toaster />
      {children}
    </div>
  );
}
