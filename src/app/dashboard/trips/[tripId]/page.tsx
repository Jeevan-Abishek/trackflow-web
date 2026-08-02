import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripTracker } from "./trip-tracker";

export default async function TripPage({ params }: { params: { tripId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trip } = await supabase.from("trips").select("*").eq("id", params.tripId).single();
  if (!trip || trip.owner_id !== user.id) notFound();

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("trip_id", trip.id)
    .order("recorded_at", { ascending: true })
    .limit(2000);

  const { data: share } = await supabase
    .from("trip_shares")
    .select("*")
    .eq("trip_id", trip.id)
    .eq("revoked", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: geofences }, { data: contacts }] = await Promise.all([
    supabase.from("geofences").select("*").eq("owner_id", user.id),
    supabase.from("emergency_contacts").select("*").eq("owner_id", user.id),
  ]);

  return (
    <TripTracker
      trip={trip}
      initialLocations={locations ?? []}
      initialShare={share ?? null}
      geofences={geofences ?? []}
      emergencyContacts={contacts ?? []}
    />
  );
}
