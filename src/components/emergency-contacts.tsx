"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { EmergencyContact } from "@/lib/types";

export function EmergencyContacts({ ownerId, initialContacts }: { ownerId: string; initialContacts: EmergencyContact[] }) {
  const supabase = createClient();
  const [contacts, setContacts] = useState(initialContacts);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const { data } = await supabase
      .from("emergency_contacts")
      .insert({ owner_id: ownerId, name, phone })
      .select()
      .single();
    if (data) setContacts((c) => [data, ...c]);
    setName("");
    setPhone("");
  }

  async function removeContact(id: string) {
    await supabase.from("emergency_contacts").delete().eq("id", id);
    setContacts((c) => c.filter((x) => x.id !== id));
  }

  return (
    <Card>
      <h2 className="mb-1 font-medium">Emergency contacts</h2>
      <p className="mb-4 text-sm text-ink/60">
        Shown when you press SOS during a live session, so you can reach them in one tap.
      </p>
      <form onSubmit={addContact} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="ec-name">Name</Label>
          <Input id="ec-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="ec-phone">Phone</Label>
          <Input id="ec-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91…" />
        </div>
        <div className="flex items-end">
          <Button type="submit" size="sm" className="w-full">
            Add contact
          </Button>
        </div>
      </form>
      <div className="space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
            <span>
              {c.name} · <span className="text-ink/50">{c.phone}</span>
            </span>
            <button onClick={() => removeContact(c.id)} className="text-xs text-danger-500">
              Remove
            </button>
          </div>
        ))}
        {contacts.length === 0 && <p className="text-sm text-ink/50">No emergency contacts yet.</p>}
      </div>
    </Card>
  );
}
