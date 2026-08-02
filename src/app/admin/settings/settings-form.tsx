"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

interface Branding {
  app_name: string;
  primary_color: string;
  logo_url: string | null;
}

export function SettingsForm({ branding }: { branding: Branding }) {
  const supabase = createClient();
  const [form, setForm] = useState(branding);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    await supabase.from("app_settings").update({ value: form }).eq("key", "branding");
    await supabase.rpc("log_audit", { p_action: "branding_updated", p_entity_type: "app_settings", p_entity_id: "branding", p_metadata: form });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <Card>
      <h2 className="mb-4 font-medium">White-label branding</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="app-name">App name</Label>
          <Input id="app-name" value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="primary-color">Primary color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              className="h-11 w-14 rounded-lg border border-line"
            />
            <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="logo-url">Logo URL</Label>
          <Input
            id="logo-url"
            placeholder="https://…"
            value={form.logo_url ?? ""}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })}
          />
        </div>
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save settings"}
        </Button>
      </form>
      <p className="mt-3 text-xs text-ink/40">
        Stored centrally in <code>app_settings</code> — read it anywhere in the app to fully white-label the UI.
      </p>
    </Card>
  );
}
