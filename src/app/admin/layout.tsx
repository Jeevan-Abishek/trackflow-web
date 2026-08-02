import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/live-map", label: "Live map" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/logs", label: "Activity logs" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<{ role: string }[]>()
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-mist">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white p-4 sm:block">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
          <span className="font-display text-lg font-semibold tracking-tight">TrackFlow</span>
        </Link>
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-ink/40">Admin</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-2 py-2 text-sm font-medium text-ink/70 hover:bg-cloud hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
          <span className="text-sm text-ink/50">Signed in as {user.email ?? user.phone}</span>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-brand-500">
              Back to app
            </Link>
            <SignOutButton />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
