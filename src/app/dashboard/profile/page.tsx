import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { ProfileForm } from "./profile-form";
import { EmergencyContacts } from "@/components/emergency-contacts";
import { PushSubscribeButton } from "@/components/pwa/push-subscribe-button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: contacts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("emergency_contacts").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-semibold">Profile</h1>
      <Card>
        <ProfileForm
          userId={user!.id}
          email={user!.email ?? null}
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </Card>
      <PushSubscribeButton />
      <LanguageSwitcher />
      <EmergencyContacts ownerId={user!.id} initialContacts={contacts ?? []} />
    </div>
  );
}
