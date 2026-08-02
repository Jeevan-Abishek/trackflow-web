"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { EmergencyContact } from "@/lib/types";

export function SosPanel({
  ownerId,
  contacts,
  currentLat,
  currentLng,
}: {
  ownerId: string;
  contacts: EmergencyContact[];
  currentLat: number | null;
  currentLng: number | null;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const mapsUrl =
    currentLat != null && currentLng != null
      ? `https://www.google.com/maps?q=${currentLat},${currentLng}`
      : null;

  async function trigger() {
    setTriggered(true);
    await supabase.from("notifications").insert({
      owner_id: ownerId,
      title: "SOS triggered",
      body: mapsUrl ? `Location at time of alert: ${mapsUrl}` : "Location unavailable at time of alert.",
      severity: "critical",
    });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("SOS alert sent", { body: "Your emergency contacts are ready to be notified." });
    }
  }

  return (
    <Card className="border-danger-500/30">
      <div className="flex items-center justify-between">
        <span className="font-medium text-danger-500">Emergency</span>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setOpen(true);
            trigger();
          }}
        >
          SOS
        </Button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-ink/60">
            {triggered ? "Alert logged." : "Sending alert…"} Tap a contact to reach them directly with your location.
          </p>
          {contacts.length === 0 && (
            <p className="text-sm text-ink/50">
              No emergency contacts saved yet — add some from your{" "}
              <a href="/dashboard/profile" className="text-brand-500">
                profile
              </a>
              .
            </p>
          )}
          {contacts.map((c) => {
            const msg = encodeURIComponent(
              `I need help. This is my current location: ${mapsUrl ?? "location unavailable"}`
            );
            return (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                <span>
                  {c.name} · {c.phone}
                </span>
                <div className="flex gap-2">
                  <a href={`tel:${c.phone}`} className="text-xs font-medium text-brand-500">
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}?text=${msg}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-live-600"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
          <button onClick={() => setOpen(false)} className="text-xs text-ink/40">
            Dismiss
          </button>
        </div>
      )}
    </Card>
  );
}
