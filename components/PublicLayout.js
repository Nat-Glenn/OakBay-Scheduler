/**
 * Public-facing layout for patient booking — matches Oak Bay site branding.
 * Used by /book; links back to oakbaychiro.ca.
 */

import Image from "next/image";
import Link from "next/link";
import { CLINIC_PUBLIC } from "@/lib/booking-requests/constants";

export default function PublicLayout({ children, title, subtitle }) {
  return (
    <div className="public-booking flex min-h-dvh flex-col">
      <header className="border-b border-[#2d5016]/15 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href={CLINIC_PUBLIC.website}
            className="flex items-center gap-3"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/logo.png"
              alt={CLINIC_PUBLIC.name}
              width={140}
              height={56}
              priority
              className="h-auto w-[120px] sm:w-[140px]"
            />
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link
              href={CLINIC_PUBLIC.website}
              className="text-[#2d5016] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Main website
            </Link>
            <a
              href={`tel:${CLINIC_PUBLIC.phoneTel}`}
              className="text-[#2d5016] hover:underline"
            >
              {CLINIC_PUBLIC.phone}
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-[#2d5016] sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#5c6b5c]">{subtitle}</p>
          ) : null}
        </div>

        {children}
      </main>

      <footer className="mt-auto border-t border-[#2d5016]/10 bg-white px-4 py-4 text-center text-xs text-[#5c6b5c] sm:px-6">
        <p className="font-medium text-[#2d5016]">{CLINIC_PUBLIC.name}</p>
        <p className="mt-1">
          <a
            href={`tel:${CLINIC_PUBLIC.phoneTel}`}
            className="text-[#2d5016] hover:underline"
          >
            {CLINIC_PUBLIC.phone}
          </a>
          <span className="mx-1.5 text-[#2d5016]/40">|</span>
          <Link
            href={CLINIC_PUBLIC.website}
            className="text-[#2d5016] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            oakbaychiro.ca
          </Link>
        </p>
      </footer>
    </div>
  );
}
