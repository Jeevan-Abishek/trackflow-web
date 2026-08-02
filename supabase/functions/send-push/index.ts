// Supabase Edge Function — send-push
//
// Wire this up as a Database Webhook (Database → Webhooks in the Supabase
// dashboard) on INSERT into `public.notifications`, pointed at this
// function's URL. It's free — Supabase Edge Functions and Database
// Webhooks are both included on the free tier; only VAPID keys are
// needed, and those are self-generated (no paid service required).
//
// Generate keys once with:  npx web-push generate-vapid-keys
// Set as Edge Function secrets:
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // Database Webhook payload shape: { type, table, record, old_record }
    const record = payload.record ?? payload;
    const ownerId: string | undefined = record.owner_id;
    const title: string = record.title ?? "TrackFlow";
    const body: string | undefined = record.body ?? undefined;

    if (!ownerId) return new Response(JSON.stringify({ error: "missing owner_id" }), { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("owner_id", ownerId);

    if (error) throw error;

    const results = await Promise.allSettled(
      (subs ?? []).map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify({ title, body, url: "/dashboard" })
        )
      )
    );

    return new Response(JSON.stringify({ sent: results.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
