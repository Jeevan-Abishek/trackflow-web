"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { ApiKey, Webhook } from "@/lib/types";

export function DeveloperPanel({
  ownerId,
  initialApiKeys,
  initialWebhooks,
}: {
  ownerId: string;
  initialApiKeys: ApiKey[];
  initialWebhooks: Webhook[];
}) {
  const supabase = createClient();
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvent, setWebhookEvent] = useState<Webhook["event"]>("trip.started");

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;
    const { data } = await supabase.rpc("create_api_key", { p_name: keyName });
    const row = data?.[0];
    if (row) {
      setNewKey(row.plaintext_key);
      const { data: refreshed } = await supabase
        .from("api_keys")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      setApiKeys(refreshed ?? []);
    }
    setKeyName("");
  }

  async function revokeKey(id: string) {
    await supabase.from("api_keys").update({ revoked: true }).eq("id", id);
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));
  }

  async function addWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    const { data } = await supabase
      .from("webhooks")
      .insert({ owner_id: ownerId, url: webhookUrl, event: webhookEvent })
      .select()
      .single();
    if (data) setWebhooks((prev) => [data, ...prev]);
    setWebhookUrl("");
  }

  async function toggleWebhook(hook: Webhook) {
    const { data } = await supabase
      .from("webhooks")
      .update({ active: !hook.active })
      .eq("id", hook.id)
      .select()
      .single();
    if (data) setWebhooks((prev) => prev.map((w) => (w.id === hook.id ? data : w)));
  }

  async function removeWebhook(id: string) {
    await supabase.from("webhooks").delete().eq("id", id);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Developer</h1>
        <p className="mt-1 text-sm text-ink/60">API keys and webhooks for integrating TrackFlow with your systems.</p>
      </div>

      <Card>
        <h2 className="mb-1 font-medium">API keys</h2>
        <p className="mb-4 text-sm text-ink/60">
          Use <code>Authorization: Bearer &lt;key&gt;</code> against <code>GET /api/v1/trips</code> and{" "}
          <code>GET /api/v1/trips/:id/locations</code>.
        </p>
        <form onSubmit={createKey} className="mb-4 flex gap-2">
          <Input placeholder={'Key name (e.g. "CRM integration")'} value={keyName} onChange={(e) => setKeyName(e.target.value)} />
          <Button type="submit" size="sm">
            Create key
          </Button>
        </form>
        {newKey && (
          <div className="mb-4 rounded-xl border border-live-500/30 bg-live-50 p-3 text-sm">
            <p className="mb-1 font-medium text-live-600">Copy this key now — it won't be shown again:</p>
            <code className="break-all">{newKey}</code>
          </div>
        )}
        <div className="space-y-2">
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{k.name}</span>
                <span className="ml-2 font-mono text-ink/50">tf_{k.key_prefix}…</span>
              </div>
              {k.revoked ? (
                <span className="text-xs text-ink/40">Revoked</span>
              ) : (
                <button onClick={() => revokeKey(k.id)} className="text-xs text-danger-500">
                  Revoke
                </button>
              )}
            </div>
          ))}
          {apiKeys.length === 0 && <p className="text-sm text-ink/50">No API keys yet.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-medium">Webhooks</h2>
        <p className="mb-4 text-sm text-ink/60">
          We'll POST a JSON payload to your URL, signed with a per-webhook secret in the{" "}
          <code>X-TrackFlow-Secret</code> header.
        </p>
        <form onSubmit={addWebhook} className="mb-4 space-y-3">
          <div>
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              id="webhook-url"
              placeholder="https://your-app.example.com/webhooks/trackflow"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="webhook-event">Event</Label>
            <select
              id="webhook-event"
              value={webhookEvent}
              onChange={(e) => setWebhookEvent(e.target.value as Webhook["event"])}
              className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
            >
              <option value="trip.started">trip.started</option>
              <option value="trip.ended">trip.ended</option>
              <option value="geofence.enter">geofence.enter</option>
              <option value="geofence.exit">geofence.exit</option>
            </select>
          </div>
          <Button type="submit" size="sm">
            Add webhook
          </Button>
        </form>
        <div className="space-y-2">
          {webhooks.map((w) => (
            <div key={w.id} className="rounded-xl border border-line px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{w.url}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleWebhook(w)} className="text-xs font-medium text-brand-500">
                    {w.active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => removeWebhook(w.id)} className="text-xs text-danger-500">
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-ink/50">
                {w.event} · secret <code>{w.secret.slice(0, 8)}…</code>
              </p>
            </div>
          ))}
          {webhooks.length === 0 && <p className="text-sm text-ink/50">No webhooks configured.</p>}
        </div>
      </Card>
    </div>
  );
}
