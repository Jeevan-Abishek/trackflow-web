import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/primitives";
import { AdminLiveMap } from "./admin-live-map";
import type { Trip } from "@/lib/types";

interface ActiveTripRow extends Trip {
  profiles: { full_name: string | null } | null;
}

export default async function AdminLiveMapPage() {
  const supabase = createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*, profiles!trips_owner_id_fkey(full_name)")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .returns<ActiveTripRow[]>();

  const tripIds = (trips ?? []).map((t) => t.id);
  const { data: locations } = tripIds.length
    ? await supabase.from("locations").select("*").in("trip_id", tripIds).order("recorded_at", { ascending: true })
    : { data: [] as never[] };

  const latestByTrip = new Map<string, { lat: number; lng: number; heading: number | null }>();
  for (const l of locations ?? []) {
    latestByTrip.set(l.trip_id, { lat: l.lat, lng: l.lng, heading: l.heading });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="h-[calc(100vh-140px)] overflow-hidden p-0">
        <AdminLiveMap points={Array.from(latestByTrip.values())} />
      </Card>
      <div className="space-y-3">
        <h1 className="font-display text-lg font-semibold">Active sessions ({trips?.length ?? 0})</h1>
        {(trips ?? []).map((trip) => (
          <Card key={trip.id} className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{trip.title}</span>
              <Badge tone="live">Live</Badge>
            </div>
            <p className="mt-1 text-xs text-ink/50">{trip.profiles?.full_name ?? "Unknown user"}</p>
          </Card>
        ))}
        {(!trips || trips.length === 0) && <p className="text-sm text-ink/50">No active sessions right now.</p>}
      </div>
    </div>
  );
}
