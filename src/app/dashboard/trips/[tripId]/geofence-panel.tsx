"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { Geofence } from "@/lib/types";

export function GeofencePanel({
  tripId,
  ownerId,
  fences,
  currentLat,
  currentLng,
  onFencesChange,
}: {
  tripId: string;
  ownerId: string;
  fences: Geofence[];
  currentLat: number | null;
  currentLng: number | null;
  onFencesChange: (fences: Geofence[]) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [radius, setRadius] = useState("200");

  async function addFence(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || currentLat == null || currentLng == null) return;
    const { data } = await supabase
      .from("geofences")
      .insert({
        owner_id: ownerId,
        trip_id: tripId,
        name,
        center_lat: currentLat,
        center_lng: currentLng,
        radius_m: Number(radius) || 200,
      })
      .select()
      .single();
    if (data) onFencesChange([...fences, data]);
    setName("");
  }

  async function removeFence(id: string) {
    await supabase.from("geofences").delete().eq("id", id);
    onFencesChange(fences.filter((f) => f.id !== id));
  }

  return (
    <Card>
      <h2 className="mb-1 font-medium">Geofences</h2>
      <p className="mb-3 text-sm text-ink/60">Get notified when this trip enters or exits a zone.</p>
      <form onSubmit={addFence} className="mb-3 space-y-2">
        <div>
          <Label htmlFor="fence-name">Zone name</Label>
          <Input id="fence-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse" />
        </div>
        <div>
          <Label htmlFor="fence-radius">Radius (meters)</Label>
          <Input id="fence-radius" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
        </div>
        <Button type="submit" size="sm" disabled={currentLat == null}>
          {currentLat == null ? "Waiting for GPS…" : "Add zone at current location"}
        </Button>
      </form>
      <div className="space-y-2">
        {fences.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
            <span>
              {f.name} · {f.radius_m}m
            </span>
            <button onClick={() => removeFence(f.id)} className="text-xs text-danger-500">
              Remove
            </button>
          </div>
        ))}
        {fences.length === 0 && <p className="text-sm text-ink/50">No zones set for this trip.</p>}
      </div>
    </Card>
  );
}
