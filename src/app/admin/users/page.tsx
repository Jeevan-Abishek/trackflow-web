import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Users</h1>
      <Card className="p-0">
        <UsersTable users={users ?? []} />
      </Card>
    </div>
  );
}
