import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { ExportButton } from "../export-button";

export default async function AdminVehiclesPage() {
  const supabase = createClient();
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Vehicles</h1>
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-line p-4">
          <span className="text-sm text-ink/50">{vehicles?.length ?? 0} vehicles across all fleets</span>
          <ExportButton filename="vehicles" rows={vehicles ?? []} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Plate</th>
              <th className="px-4 py-2 font-medium">Added</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v) => (
              <tr key={v.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{v.name}</td>
                <td className="px-4 py-3 capitalize text-ink/60">{v.vehicle_type}</td>
                <td className="px-4 py-3 font-mono text-ink/60">{v.plate_number ?? "—"}</td>
                <td className="px-4 py-3 text-ink/60">{new Date(v.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!vehicles || vehicles.length === 0) && <p className="p-6 text-sm text-ink/50">No vehicles yet.</p>}
      </Card>
    </div>
  );
}
