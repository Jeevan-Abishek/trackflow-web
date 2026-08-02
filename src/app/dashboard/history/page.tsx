import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDistance, formatSpeed, formatDuration } from "@/lib/geo";

export default async function HistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold">Trip history</h1>
      <p className="mb-6 text-sm text-ink/60">Every session you've started, oldest last.</p>

      {!trips || trips.length === 0 ? (
        <Card className="py-16 text-center text-sm text-ink/50">No trips yet.</Card>
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/dashboard/trips/${trip.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-medium">{trip.title}</div>
                  <div className="text-xs text-ink/50">
                    {new Date(trip.started_at).toLocaleString()}
                    {trip.ended_at &&
                      ` · ${formatDuration(new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime())}`}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-ink/60">
                  <span className="font-mono">{formatDistance(trip.total_distance_m)}</span>
                  <span className="font-mono">{formatSpeed(trip.max_speed_kmh)} max</span>
                  <Badge tone={trip.status === "active" ? "live" : "ended"}>
                    {trip.status === "active" ? "Live" : "Ended"}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
