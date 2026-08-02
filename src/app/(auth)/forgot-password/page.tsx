"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "error" | "success"; message?: string }>({
    type: "idle",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile`,
    });
    if (error) return setStatus({ type: "error", message: error.message });
    setStatus({ type: "success", message: "Check your inbox for a reset link." });
  }

  return (
    <Card>
      <h1 className="mb-1 font-display text-xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-sm text-ink/60">We'll email you a secure link.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button className="w-full" type="submit" disabled={status.type === "loading"}>
          {status.type === "loading" ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      {status.type === "error" && <p className="mt-4 text-sm text-danger-500">{status.message}</p>}
      {status.type === "success" && <p className="mt-4 text-sm text-live-600">{status.message}</p>}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-ink/50">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
