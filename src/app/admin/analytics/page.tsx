import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { AnalyticsCharts } from "./analytics-charts";
import { ExportButton } from "../export-button";
import { formatDistance, formatSpeed } from "@/lib/geo";
import type { Trip } from "@/lib/types";

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("trips")
    .select(
      "id, title, created_at, total_distance_m, max_speed_kmh, avg_speed_kmh, status"
    )
    .order("created_at", { ascending: true });

  const rows: Trip[] = (data ?? []) as Trip[];

  const totalDistance = rows.reduce(
    (s, t) => s + t.total_distance_m,
    0
  );

  const avgSpeed = rows.length
    ? rows.reduce((s, t) => s + t.avg_speed_kmh, 0) / rows.length
    : 0;

  const maxSpeed = rows.reduce(
    (m, t) => Math.max(m, t.max_speed_kmh),
    0
  );

  const byWeek = new Map<
    string,
    { distance: number; trips: number }
  >();

  for (const t of rows) {
    const d = new Date(t.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());

    const key = weekStart.toISOString().slice(0, 10);

    const entry = byWeek.get(key) ?? {
      distance: 0,
      trips: 0,
    };

    entry.distance += t.total_distance_m;
    entry.trips += 1;

    byWeek.set(key, entry);
  }

  const weekly = Array.from(byWeek.entries()).map(([week, v]) => ({
    week,
    distanceKm: Math.round(v.distance / 100) / 10,
    trips: v.trips,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">
          Analytics
        </h1>

        <ExportButton
          filename="trip-analytics"
          rows={rows}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink/50">
            Total distance
          </p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {formatDistance(totalDistance)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-ink/50">
            Average speed
          </p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {formatSpeed(avgSpeed)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-ink/50">
            Peak speed recorded
          </p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {formatSpeed(maxSpeed)}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-medium">
          Weekly distance & trip volume
        </h2>

        <AnalyticsCharts data={weekly} />
      </Card>
    </div>
  );
}
