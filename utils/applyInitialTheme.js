export function applyInitialTheme() {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const isDark = stored === "dark" || (stored === null && prefersDark);

    document.documentElement.classList.toggle("dark", isDark);
  } catch {}
}
