import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "@/utils/DarkModeProvider";
import { NavBarProvider } from "@/utils/NavBarProvider";
import { Toaster } from "@/components/ui/sonner";
import { Roboto } from "next/font/google";
import { Montserrat } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Oak Bay Scheduler",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
  } catch {}
})();
            `,
          }}
        />
      </head>
      <body className={`${montserrat.className} antialiased`}>
        <NavBarProvider>
          <DarkModeProvider>
            <Toaster />
            {children}
          </DarkModeProvider>
        </NavBarProvider>
      </body>
    </html>
  );
}
