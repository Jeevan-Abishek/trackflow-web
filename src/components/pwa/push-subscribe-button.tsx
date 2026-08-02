"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeToPush } from "@/lib/push";

export function PushSubscribeButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "on" | "unsupported">("idle");

  async function handleClick() {
    setStatus("loading");
    const sub = await subscribeToPush();
    setStatus(sub ? "on" : "unsupported");
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
      <div>
        <p className="font-medium">Push notifications</p>
        <p className="text-ink/50">Get alerted for geofence events and SOS activity, even when the tab is closed.</p>
      </div>
      <Button size="sm" variant="secondary" onClick={handleClick} disabled={status === "loading" || status === "on"}>
        {status === "on" ? "Enabled ✓" : status === "loading" ? "Enabling…" : "Enable"}
      </Button>
    </div>
  );
}
