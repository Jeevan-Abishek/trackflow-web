import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";

const steps = [
  {
    label: "Start",
    title: "Start a session",
    body: "One tap begins sharing your position from this browser tab — no app to install.",
  },
  {
    label: "Share",
    title: "Send the link",
    body: "A private URL is generated instantly. Send it by WhatsApp, Telegram, email, or copy it anywhere.",
  },
  {
    label: "Watch",
    title: "Track live",
    body: "Whoever opens the link watches the position move in real time, with speed, distance, and ETA.",
  },
];

const features = [
  { title: "Real-time by default", body: "Positions land on the map the moment they're sent — powered by Supabase Realtime." },
  { title: "No account for viewers", body: "Anyone with the link can watch. Only the person sharing needs to sign in." },
  { title: "You control the link", body: "Turn sharing off at any moment and the link stops working immediately." },
  { title: "Built on open maps", body: "Runs on OpenStreetMap data via MapLibre — no map API key, no map costs." },
];

export default function LandingPage() {
  return (
    <div className="bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="font-display text-lg font-semibold tracking-tight">TrackFlow</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink/60 sm:flex">
            <Link href="/#features" className="hover:text-ink">Features</Link>
            <Link href="/pricing" className="hover:text-ink">Pricing</Link>
            <Link href="/contact" className="hover:text-ink">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:pt-28">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink/60">
          <span className="h-1.5 w-1.5 rounded-full bg-live-500" /> Live right now on the open map
        </span>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Share where you are, live, with one link.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink/60">
          TrackFlow turns your browser into a live GPS beacon. Start a session, send the link, and anyone can watch
          your position move — updated in real time.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">Start tracking free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">Sign in</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title} className="relative">
              <span className="mb-3 inline-block font-mono text-xs text-brand-500">{step.label}</span>
              <h3 className="font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="mb-8 text-center font-display text-2xl font-semibold">Built for real tracking, not demos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title}>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink/60">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-line bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-ink/50 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} TrackFlow</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/help" className="hover:text-ink">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
