import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
          <span className="font-display text-lg font-semibold tracking-tight">TrackFlow</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
