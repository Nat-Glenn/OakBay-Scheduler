/**
 * Forces light theme on the public /book route so form labels and inputs stay readable
 * when the staff app runs in dark mode (html.dark).
 */

"use client";

import { useEffect } from "react";

export default function PublicBookingTheme({ children }) {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");

    return () => {
      if (hadDark) html.classList.add("dark");
    };
  }, []);

  return children;
}
