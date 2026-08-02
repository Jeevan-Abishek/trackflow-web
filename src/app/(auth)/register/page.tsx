"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "error" | "success"; message?: string }>({
    type: "idle",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return setStatus({ type: "error", message: error.message });
    setStatus({ type: "success", message: "Check your inbox to confirm your email." });
  }

  return (
    <Card>
      <h1 className="mb-1 font-display text-xl font-semibold">Create your account</h1>
      <p className="mb-6 text-sm text-ink/60">Start sharing live GPS sessions in minutes.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" type="submit" disabled={status.type === "loading"}>
          {status.type === "loading" ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {status.type === "error" && <p className="mt-4 text-sm text-danger-500">{status.message}</p>}
      {status.type === "success" && <p className="mt-4 text-sm text-live-600">{status.message}</p>}

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-500">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
