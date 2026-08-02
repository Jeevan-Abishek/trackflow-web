import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { TripsTrendChart } from "./trips-trend-chart";
import { formatDistance } from "@/lib/geo";

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [{ count: userCount }, { count: activeTripCount }, { count: totalTripCount }, { data: trips }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("trips").select("*", { count: "exact", head: true }),
      supabase
        .from("trips")
        .select("created_at, total_distance_m, status")
        .order("created_at", { ascending: true })
        .returns<{ created_at: string; total_distance_m: number; status: string }[]>(),
    ]);

  const totalDistance = (trips ?? []).reduce((sum, t) => sum + (t.total_distance_m ?? 0), 0);

  const byDay = new Map<string, number>();
  for (const t of trips ?? []) {
    const day = new Date(t.created_at).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const trend = Array.from(byDay.entries()).map(([date, count]) => ({ date, count }));

  const metrics = [
    { label: "Total users", value: userCount ?? 0 },
    { label: "Active sessions", value: activeTripCount ?? 0 },
    { label: "Total trips", value: totalTripCount ?? 0 },
    { label: "Distance tracked", value: formatDistance(totalDistance) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <p className="text-sm text-ink/50">{m.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{m.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="mb-4 font-medium">Trips created per day</h2>
        <TripsTrendChart data={trend} />
      </Card>
    </div>
  );
}
