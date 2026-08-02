import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/primitives";
import { ExportButton } from "../export-button";

export default async function AdminDriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Drivers</h1>
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-line p-4">
          <span className="text-sm text-ink/50">{drivers?.length ?? 0} drivers across all fleets</span>
          <ExportButton filename="drivers" rows={drivers ?? []} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">License</th>
              <th className="px-4 py-2 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {(drivers ?? []).map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{d.full_name}</td>
                <td className="px-4 py-3 text-ink/60">{d.phone ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-ink/60">{d.license_number ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={d.score >= 80 ? "live" : d.score >= 50 ? "warn" : "ended"}>{d.score.toFixed(0)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!drivers || drivers.length === 0) && <p className="p-6 text-sm text-ink/50">No drivers yet.</p>}
      </Card>
    </div>
  );
}
