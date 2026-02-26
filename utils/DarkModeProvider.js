"use client";

import { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext(null);

export const DarkModeProvider = ({ children }) => {
  const [boolDark, setBoolDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setBoolDark(isDark);
    setMounted(true);
  }, []);

  const handleBool = () => {
    setBoolDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const sync = () => {
      document.documentElement.classList.toggle("dark", media.matches);
      setBoolDark(media.matches);
    };

    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!mounted) return null; // 🔑 prevents hydration mismatch

  return (
    <DarkModeContext.Provider value={{ boolDark, handleBool }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);
