import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/primitives";
import Link from "next/link";
import { NewSessionButton } from "./new-session-button";
import { formatDistance, formatSpeed } from "@/lib/geo";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const activeTrips = (trips ?? []).filter((t) => t.status === "active");
  const recentTrips = (trips ?? []).filter((t) => t.status === "ended").slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Live sessions</h1>
          <p className="mt-1 text-sm text-ink/60">Start sharing your position, or jump back into an active one.</p>
        </div>
        <NewSessionButton />
      </div>

      {activeTrips.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 h-12 w-12 rounded-full bg-brand-50" />
          <h2 className="font-display text-lg font-semibold">No active sessions</h2>
          <p className="mt-1 max-w-sm text-sm text-ink/60">
            Start a new session to get a live tracking link you can send to anyone.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTrips.map((trip) => (
            <Link key={trip.id} href={`/dashboard/trips/${trip.id}`}>
              <Card className="h-full transition-shadow hover:shadow-pop">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium">{trip.title}</span>
                  <Badge tone="live">Live</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-ink/50">Distance</dt>
                  <dd className="text-right font-mono">{formatDistance(trip.total_distance_m)}</dd>
                  <dt className="text-ink/50">Max speed</dt>
                  <dd className="text-right font-mono">{formatSpeed(trip.max_speed_kmh)}</dd>
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold">Recently ended</h2>
        {recentTrips.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing here yet.</p>
        ) : (
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <Link key={trip.id} href={`/dashboard/trips/${trip.id}`}>
                <Card className="flex items-center justify-between py-4">
                  <span className="font-medium">{trip.title}</span>
                  <div className="flex items-center gap-4 text-sm text-ink/50">
                    <span className="font-mono">{formatDistance(trip.total_distance_m)}</span>
                    <Badge tone="ended">Ended</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
