import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { ExportButton } from "../export-button";

export default async function AdminLogsPage() {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Activity logs</h1>
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-line p-4">
          <span className="text-sm text-ink/50">Most recent 200 events</span>
          <ExportButton
            filename="audit-logs"
            rows={(logs ?? []).map((l) => ({ ...l, metadata: JSON.stringify(l.metadata) }))}
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/50">
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Entity</th>
              <th className="px-4 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-ink/60">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium">{l.action}</td>
                <td className="px-4 py-3 text-ink/60">
                  {l.entity_type}
                  {l.entity_id ? ` · ${l.entity_id.slice(0, 8)}…` : ""}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink/50">{JSON.stringify(l.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!logs || logs.length === 0) && <p className="p-6 text-sm text-ink/50">No activity recorded yet.</p>}
      </Card>
    </div>
  );
}
