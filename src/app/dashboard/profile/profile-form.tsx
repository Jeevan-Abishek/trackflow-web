"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export function ProfileForm({
  userId,
  email,
  fullName,
  phone,
}: {
  userId: string;
  email: string | null;
  fullName: string;
  phone: string;
}) {
  const supabase = createClient();
  const [name, setName] = useState(fullName);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    await supabase.from("profiles").update({ full_name: name, phone: phoneNumber }).eq("id", userId);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input value={email ?? "—"} disabled />
      </div>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      </div>
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save changes"}
      </Button>
    </form>
  );
}
