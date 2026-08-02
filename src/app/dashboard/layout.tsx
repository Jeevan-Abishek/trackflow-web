import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-mist">
      <header className="sticky top-0 z-10 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="font-display text-lg font-semibold tracking-tight">TrackFlow</span>
          </Link>
          <DashboardNav />
          <div className="flex items-center gap-3">
            <NotificationBell ownerId={user.id} />
            <span className="hidden text-sm text-ink/50 sm:inline">{user.email ?? user.phone}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
