"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";

export function DashboardNav() {
  const { t } = useLanguage();
  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-ink/60 sm:flex">
      <Link href="/dashboard" className="hover:text-ink">
        {t("nav.liveSessions")}
      </Link>
      <Link href="/dashboard/history" className="hover:text-ink">
        {t("nav.tripHistory")}
      </Link>
      <Link href="/dashboard/fleet" className="hover:text-ink">
        {t("nav.fleet")}
      </Link>
      <Link href="/dashboard/fleet-ops" className="hover:text-ink">
        {t("nav.fleetOps")}
      </Link>
      <Link href="/dashboard/profile" className="hover:text-ink">
        {t("nav.profile")}
      </Link>
      <Link href="/dashboard/developer" className="hover:text-ink">
        {t("nav.developer")}
      </Link>
    </nav>
  );
}
