"use client";

/*
 * Per-device reading state, kept in localStorage:
 * - which stories have been read (per brief)
 * - a daily reading streak (a day counts once you read at least one story)
 */

const EVT = "brieflet:reading";
const READ_KEY = (briefId: number) => `brieflet:read:${briefId}`;
const STREAK_KEY = "brieflet:streak";

export type Streak = { current: number; best: number; last: string | null; total: number };

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, device local time
const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota: ignore */
  }
}

export function getReadIds(briefId: number): Set<number> {
  return new Set(load<number[]>(READ_KEY(briefId), []));
}

export function getStreak(): Streak {
  const s = load<Streak>(STREAK_KEY, { current: 0, best: 0, last: null, total: 0 });
  // A streak is only "alive" if the last reading day was today or yesterday.
  if (s.last && dayDiff(s.last, today()) > 1) return { ...s, current: 0 };
  return s;
}

export function markRead(briefId: number, itemId: number) {
  const ids = getReadIds(briefId);
  if (ids.has(itemId)) return;
  ids.add(itemId);
  save(READ_KEY(briefId), [...ids]);

  const s = load<Streak>(STREAK_KEY, { current: 0, best: 0, last: null, total: 0 });
  const t = today();
  if (s.last !== t) {
    s.current = s.last && dayDiff(s.last, t) === 1 ? s.current + 1 : 1;
    s.last = t;
  }
  s.best = Math.max(s.best, s.current);
  s.total += 1;
  save(STREAK_KEY, s);
  window.dispatchEvent(new CustomEvent(EVT));
}

export function onReadingChange(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}
