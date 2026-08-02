import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("app_settings").select("*").eq("key", "branding").single();

  const branding = (data?.value as { app_name: string; primary_color: string; logo_url: string | null }) ?? {
    app_name: "TrackFlow",
    primary_color: "#2563EB",
    logo_url: null,
  };

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <SettingsForm branding={branding} />
    </div>
  );
}
