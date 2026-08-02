import Link from "next/link";

export function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="font-display text-lg font-semibold tracking-tight">TrackFlow</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-8 font-display text-3xl font-semibold">{title}</h1>
        <div className="prose-sm space-y-4 text-sm leading-relaxed text-ink/70">{children}</div>
      </main>
    </div>
  );
}
