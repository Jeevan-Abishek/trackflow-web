import { createClient } from "@/lib/supabase/server";
import { DeveloperPanel } from "./developer-panel";

export default async function DeveloperPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: apiKeys }, { data: webhooks }] = await Promise.all([
    supabase.from("api_keys").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("webhooks").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
  ]);

  return <DeveloperPanel ownerId={user!.id} initialApiKeys={apiKeys ?? []} initialWebhooks={webhooks ?? []} />;
}
