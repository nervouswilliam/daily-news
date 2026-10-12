import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { Providers, StreakBadge, ThemeToggle } from "@/components/chrome";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "700", "800"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Brieflet: your day in 60 seconds", template: "%s · Brieflet" },
  description: "Daily AI-written news briefs you can swipe through in a minute.",
  openGraph: { siteName: "Brieflet", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh font-sans">
        <Providers>
          <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
              <Link href="/" className="mr-auto flex items-center gap-2" aria-label="Brieflet home">
                <Logo />
                <span className="font-display text-xl font-extrabold tracking-tight">Brieflet</span>
              </Link>
              <nav className="flex items-center gap-1 text-sm font-semibold">
                <Link href="/" className="rounded-full px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-ink">
                  Today
                </Link>
                <Link href="/archive" className="rounded-full px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-ink">
                  Archive
                </Link>
              </nav>
              <StreakBadge />
              <ThemeToggle />
            </div>
          </header>
          {children}
          <footer className="mx-auto max-w-3xl px-4 pb-12 pt-6 text-center text-sm text-muted">
            Written by Claude, curated for one very busy reader ✌️
          </footer>
        </Providers>
      </body>
    </html>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="0.55" stopColor="#F43F5E" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#lg)" />
      <rect x="8" y="9" width="16" height="3.5" rx="1.75" fill="#fff" />
      <rect x="8" y="15" width="11" height="3.5" rx="1.75" fill="#fff" opacity=".85" />
      <rect x="8" y="21" width="7" height="3.5" rx="1.75" fill="#fff" opacity=".7" />
    </svg>
  );
}
