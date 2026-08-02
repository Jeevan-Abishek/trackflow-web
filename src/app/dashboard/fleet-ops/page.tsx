import { createClient } from "@/lib/supabase/server";
import { FleetOpsManager } from "./fleet-ops-manager";

export default async function FleetOpsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownerId = user!.id;

  const [{ data: vehicles }, { data: fuel }, { data: maintenance }, { data: expenses }, { data: health }] =
    await Promise.all([
      supabase.from("vehicles").select("*").eq("owner_id", ownerId),
      supabase.from("fuel_logs").select("*").eq("owner_id", ownerId).order("logged_at", { ascending: false }).limit(50),
      supabase
        .from("maintenance_reminders")
        .select("*")
        .eq("owner_id", ownerId)
        .order("due_date", { ascending: true }),
      supabase.from("expense_logs").select("*").eq("owner_id", ownerId).order("logged_at", { ascending: false }).limit(50),
      supabase
        .from("vehicle_health_logs")
        .select("*")
        .eq("owner_id", ownerId)
        .order("logged_at", { ascending: false })
        .limit(50),
    ]);

  return (
    <FleetOpsManager
      ownerId={ownerId}
      vehicles={vehicles ?? []}
      initialFuel={fuel ?? []}
      initialMaintenance={maintenance ?? []}
      initialExpenses={expenses ?? []}
      initialHealth={health ?? []}
    />
  );
}
