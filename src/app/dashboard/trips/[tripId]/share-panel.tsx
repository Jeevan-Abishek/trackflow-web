"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/share/qr-code";
import type { Trip, TripShare } from "@/lib/types";

export function SharePanel({
  trip,
  isPublic,
  share,
  onPublicChange,
  onShareChange,
}: {
  trip: Trip;
  isPublic: boolean;
  share: TripShare | null;
  onPublicChange: (next: boolean) => void;
  onShareChange: (next: TripShare | null) => void;
}) {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [oneTime, setOneTime] = useState(share?.one_time ?? false);
  const [expiresInHours, setExpiresInHours] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  async function ensureShare(): Promise<TripShare | null> {
    if (share) return share;
    const { data, error } = await supabase.from("trip_shares").insert({ trip_id: trip.id }).select().single();
    if (error || !data) return null;
    onShareChange(data);
    return data;
  }

  async function handleTogglePublic() {
    const next = !isPublic;
    if (next) await ensureShare();
    onPublicChange(next);
    await supabase.from("trips").update({ is_public: next }).eq("id", trip.id);
  }

  async function handleSaveAdvanced() {
    const current = await ensureShare();
    if (!current) return;
    setSaving(true);

    await supabase.rpc("set_share_password", { p_share_id: current.id, p_password: password || null });

    const updates: Partial<TripShare> = { one_time: oneTime };
    if (expiresInHours) {
      updates.expires_at = new Date(Date.now() + Number(expiresInHours) * 3600_000).toISOString();
    } else {
      updates.expires_at = null;
    }

    const { data } = await supabase
      .from("trip_shares")
      .update(updates)
      .eq("id", current.id)
      .select()
      .single();

    if (data) onShareChange({ ...data, password_hash: password ? "set" : null });
    setSaving(false);
  }

  const shareUrl = share
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "")}/track/${share.share_token}`
    : null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium">Public tracking link</span>
        <button
          onClick={handleTogglePublic}
          className={`h-6 w-11 rounded-full transition-colors ${isPublic ? "bg-live-500" : "bg-cloud"}`}
          aria-pressed={isPublic}
          aria-label="Toggle public sharing"
        >
          <span
            className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
              isPublic ? "translate-x-[22px]" : ""
            }`}
          />
        </button>
      </div>

      {!isPublic && <p className="text-sm text-ink/50">Turn this on to generate a link anyone can open to watch live.</p>}

      {isPublic && shareUrl && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <QrCode value={shareUrl} size={96} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="truncate rounded-xl border border-line bg-mist px-3 py-2 font-mono text-xs">
                {shareUrl}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(shareUrl)}>
                  Copy link
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, "_blank")}
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, "_blank")
                  }
                >
                  Telegram
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    window.open(`mailto:?subject=Track my location&body=${encodeURIComponent(shareUrl)}`, "_blank")
                  }
                >
                  Email
                </Button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-medium text-brand-500"
          >
            {showAdvanced ? "Hide" : "Password, expiry & one-time settings"}
          </button>

          {showAdvanced && (
            <div className="space-y-3 rounded-xl border border-line bg-mist p-4">
              <div>
                <Label htmlFor="share-password">Password (optional)</Label>
                <Input
                  id="share-password"
                  type="text"
                  placeholder="Leave blank for no password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expires-in">Expires in (hours, optional)</Label>
                <Input
                  id="expires-in"
                  type="number"
                  min={1}
                  placeholder="Never"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={oneTime} onChange={(e) => setOneTime(e.target.checked)} />
                One-time access link (revokes itself after first successful view)
              </label>
              {share && share.max_views == null && (
                <p className="text-xs text-ink/50">Views so far: {share.view_count}</p>
              )}
              <Button size="sm" onClick={handleSaveAdvanced} disabled={saving}>
                {saving ? "Saving…" : "Save link settings"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
