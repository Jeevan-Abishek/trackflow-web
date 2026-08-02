import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-mist px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-brand-50" />
      <h1 className="font-display text-2xl font-semibold">This link isn't live</h1>
      <p className="max-w-sm text-sm text-ink/60">
        The tracking link may have expired, been turned off, or never existed. Ask the sender for a fresh one.
      </p>
      <Link href="/">
        <Button variant="secondary">Go home</Button>
      </Link>
    </div>
  );
}
