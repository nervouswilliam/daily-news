import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="text-6xl">🫥</div>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Nothing to read here</h1>
      <p className="mt-3 text-lg text-muted">That brief or story doesn&apos;t exist (yet).</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="rounded-full bg-ink px-6 py-3 font-bold text-paper">Today&apos;s brief</Link>
        <Link href="/archive" className="rounded-full px-6 py-3 font-bold ring-1 ring-line">Archive</Link>
      </div>
    </main>
  );
}
