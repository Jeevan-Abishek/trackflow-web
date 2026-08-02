"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/types";

export function NotificationBell({ ownerId }: { ownerId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems(data ?? []));

    const channel = supabase
      .channel(`notifications-${ownerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `owner_id=eq.${ownerId}` },
        (payload) => {
          const notif = payload.new as AppNotification;
          setItems((prev) => [notif, ...prev].slice(0, 20));
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(notif.title, { body: notif.body ?? undefined });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, ownerId]);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true }).eq("owner_id", ownerId).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        className="relative rounded-lg p-2 hover:bg-cloud"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger-500" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-line bg-white p-2 shadow-pop">
          <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-ink/40">Notifications</p>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 && <p className="px-2 py-4 text-sm text-ink/50">Nothing yet.</p>}
            {items.map((n) => (
              <div key={n.id} className="rounded-xl px-2 py-2 hover:bg-mist">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-ink/60">{n.body}</p>}
                <p className="mt-1 text-[11px] text-ink/40">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
