import { createClient } from "@/lib/supabase/server";
import { FleetManager } from "./fleet-manager";

export default async function FleetPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("drivers").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
  ]);

  return <FleetManager initialVehicles={vehicles ?? []} initialDrivers={drivers ?? []} ownerId={user!.id} />;
}
