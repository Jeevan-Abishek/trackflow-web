"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NewSessionButton() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("trips")
      .insert({
        owner_id: user.id,
        title: `Trip · ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    setLoading(false);
    if (error || !data) return;
    router.push(`/dashboard/trips/${data.id}`);
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Starting…" : "Start new session"}
    </Button>
  );
}
