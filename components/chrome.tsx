"use client";

import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { getStreak, onReadingChange, type Streak } from "@/lib/reading";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted ? dark ? <Sun className="size-5" /> : <Moon className="size-5" /> : <span className="size-5" />}
    </button>
  );
}

export function useStreak(): Streak | null {
  const [streak, setStreak] = useState<Streak | null>(null);
  useEffect(() => {
    setStreak(getStreak());
    return onReadingChange(() => setStreak(getStreak()));
  }, []);
  return streak;
}

export function StreakBadge() {
  const streak = useStreak();
  if (!streak) return <span className="h-9 w-16" />;
  const alive = streak.current > 0;
  return (
    <span
      title={alive ? `${streak.current}-day reading streak (best: ${streak.best})` : "Read a story today to start a streak"}
      className={`inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-bold tabular-nums transition ${
        alive ? "bg-orange-500/12 text-orange-600 dark:text-orange-400" : "bg-surface-2 text-muted"
      }`}
    >
      <span className={alive ? "" : "grayscale"}>🔥</span>
      {streak.current}
    </span>
  );
}
