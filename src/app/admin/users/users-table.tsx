"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { exportToCsv } from "@/lib/export";
import type { Profile } from "@/lib/types";

export function UsersTable({ users }: { users: Profile[] }) {
  const supabase = createClient();
  const [rows, setRows] = useState(users);

  async function toggleRole(user: Profile) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", user.id);
    if (error) return;
    await supabase.rpc("log_audit", {
      p_action: "role_changed",
      p_entity_type: "profile",
      p_entity_id: user.id,
      p_metadata: { from: user.role, to: nextRole },
    });
    setRows((prev) => prev.map((r) => (r.id === user.id ? { ...r, role: nextRole } : r)));
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line p-4">
        <span className="text-sm text-ink/50">{rows.length} users</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            exportToCsv(
              "users",
              rows.map((r) => ({ id: r.id, full_name: r.full_name, phone: r.phone, role: r.role, created_at: r.created_at }))
            )
          }
        >
          Export CSV
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink/50">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Phone</th>
            <th className="px-4 py-2 font-medium">Joined</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">{u.full_name ?? "—"}</td>
              <td className="px-4 py-3 text-ink/60">{u.phone ?? "—"}</td>
              <td className="px-4 py-3 text-ink/60">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <Badge tone={u.role === "admin" ? "neutral" : "ended"}>{u.role}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="ghost" onClick={() => toggleRole(u)}>
                  Make {u.role === "admin" ? "user" : "admin"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
