"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";

type Method = "password" | "magic" | "phone";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [method, setMethod] = useState<Method>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "error" | "success"; message?: string }>({
    type: "idle",
  });

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setStatus({ type: "error", message: error.message });
    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return setStatus({ type: "error", message: error.message });
    setStatus({ type: "success", message: "Check your inbox for the sign-in link." });
  }

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return setStatus({ type: "error", message: error.message });
    setOtpSent(true);
    setStatus({ type: "success", message: "Code sent by SMS." });
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error) return setStatus({ type: "error", message: error.message });
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <Card>
      <h1 className="mb-1 font-display text-xl font-semibold">Welcome back</h1>
      <p className="mb-6 text-sm text-ink/60">Sign in to manage your live tracking sessions.</p>

      <Button variant="secondary" className="mb-4 w-full" onClick={handleGoogle} type="button">
        Continue with Google
      </Button>

      <div className="mb-4 flex items-center gap-3 text-xs text-ink/40">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>

      <div className="mb-5 flex rounded-xl bg-cloud p-1 text-sm">
        {(["password", "magic", "phone"] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMethod(m);
              setStatus({ type: "idle" });
            }}
            className={`flex-1 rounded-lg py-1.5 font-medium transition-colors ${
              method === m ? "bg-white shadow-card" : "text-ink/50"
            }`}
          >
            {m === "password" ? "Password" : m === "magic" ? "Magic link" : "Phone"}
          </button>
        ))}
      </div>

      {method === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="w-full" type="submit" disabled={status.type === "loading"}>
            {status.type === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}

      {method === "magic" && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <Label htmlFor="magic-email">Email</Label>
            <Input id="magic-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full" type="submit" disabled={status.type === "loading"}>
            {status.type === "loading" ? "Sending…" : "Email me a link"}
          </Button>
        </form>
      )}

      {method === "phone" && !otpSent && (
        <form onSubmit={handleSendPhoneOtp} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91XXXXXXXXXX"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button className="w-full" type="submit" disabled={status.type === "loading"}>
            {status.type === "loading" ? "Sending…" : "Send code"}
          </Button>
        </form>
      )}

      {method === "phone" && otpSent && (
        <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
          <div>
            <Label htmlFor="otp">6-digit code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <Button className="w-full" type="submit" disabled={status.type === "loading"}>
            {status.type === "loading" ? "Verifying…" : "Verify & sign in"}
          </Button>
        </form>
      )}

      {status.type === "error" && <p className="mt-4 text-sm text-danger-500">{status.message}</p>}
      {status.type === "success" && <p className="mt-4 text-sm text-live-600">{status.message}</p>}

      <p className="mt-6 text-center text-sm text-ink/60">
        No account?{" "}
        <Link href="/register" className="font-medium text-brand-500">
          Create one
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/forgot-password" className="font-medium text-ink/50">
          Forgot password?
        </Link>
      </p>
    </Card>
  );
}
