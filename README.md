# TrackFlow Web — Phase 1 (MVP)

Live GPS tracking, shared in one link. Sign in, start a session, send a link — anyone who opens it
watches your position update in real time. No app to install, no paid APIs.

This is **Phase 1** of the roadmap agreed for this project: a fully working core (auth, live
tracking, sharing, trip history) built to run in production today, on free-tier infrastructure,
with an architecture that the Phase 2/3 features (QR sharing, admin dashboard, analytics, fleet
management, AI ETA, etc.) can be layered onto without a rewrite.

---

## 1. Tech stack

| Layer      | Choice                                                       |
|------------|---------------------------------------------------------------|
| Frontend   | Next.js 14 (App Router), React, TypeScript, Tailwind CSS      |
| Realtime   | Supabase Realtime (Postgres logical replication over websockets) |
| Database   | Supabase Postgres, with Row Level Security                    |
| Auth       | Supabase Auth — email/password, magic link, phone OTP, Google |
| Maps       | MapLibre GL JS + OpenStreetMap tiles (no API key, no cost)     |
| Hosting    | Render (free web service plan)                                 |
| CI/CD      | GitHub Actions (typecheck, lint, build) + Render auto-deploy   |

Total cost to run this MVP: **₹0**, using only free tiers.

---

## 2. Project structure

```
trackflow-web/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                     Landing page
│  │  ├─ (auth)/login|register|forgot-password
│  │  ├─ auth/callback/route.ts       OAuth / magic link / OTP redirect handler
│  │  ├─ dashboard/                   Authenticated app (layout has the auth guard)
│  │  │  ├─ page.tsx                  Active sessions list
│  │  │  ├─ trips/[tripId]/           Live tracking session (owner view)
│  │  │  ├─ history/                 Trip history
│  │  │  └─ profile/                 Profile edit
│  │  ├─ track/[shareToken]/          Public tracking page (no login required)
│  │  └─ pricing|contact|help|privacy|terms
│  ├─ components/
│  │  ├─ map/live-map.tsx             MapLibre wrapper: marker, pulse, route polyline
│  │  ├─ ui/                          Button, Card, Badge, Input primitives
│  │  └─ static-page.tsx
│  ├─ lib/
│  │  ├─ supabase/client.ts|server.ts Browser + server Supabase clients
│  │  ├─ geo.ts                       Haversine distance, bearing, formatting
│  │  └─ types.ts                     Shared types + hand-written Database type
│  └─ middleware.ts                   Refreshes the Supabase session cookie
├─ supabase/schema.sql                Tables, RLS policies, realtime publication
├─ render.yaml                        Render deployment blueprint
├─ .github/workflows/ci.yml           Typecheck → lint → build on every push
└─ .env.example
```

---

## 3. Local setup

### 3.1 Create the Supabase project (free tier)

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`. This creates the
   `profiles`, `trips`, `trip_shares`, and `locations` tables, all Row Level Security policies,
   and adds `trips`/`locations` to the `supabase_realtime` publication.
3. Under **Authentication → Providers**:
   - **Email**: on by default. For magic links, no extra config needed.
   - **Google**: enable it and add your OAuth client ID/secret (Google Cloud Console, free).
     Add `https://<your-supabase-project>.supabase.co/auth/v1/callback` as an authorized redirect URI.
   - **Phone**: enable it and connect an SMS provider (e.g. Twilio). **Note:** Supabase itself is
     free, but SMS delivery is billed by the provider — there's no free tier for SMS. If you want
     to stay at ₹0, ship with Email + Magic Link + Google only and add Phone OTP once you're ready
     to pay for SMS.
4. Under **Authentication → URL Configuration**, add your site URL and
   `<site-url>/auth/callback` as a redirect URL (do this for both local `http://localhost:3000`
   and your production Render URL).
5. Copy the **Project URL** and **anon public key** from Settings → API.

### 3.2 Run the app

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Open `http://localhost:3000`. Register an account, start a session, allow location access, and
switch on the public link — open it in another browser/tab to watch it live.

---

## 4. How live tracking works

1. Starting a session inserts one row into `trips` (`status = 'active'`, `is_public = false`).
2. The owner's browser calls `navigator.geolocation.watchPosition(...)`. Every ping (throttled to
   one every ~3s) is inserted into `locations` and rolls up into `trips.total_distance_m`,
   `max_speed_kmh`, `avg_speed_kmh` via a haversine calculation done client-side (`src/lib/geo.ts`).
3. Turning on "Public tracking link" creates a row in `trip_shares` (an unguessable token) and
   flips `trips.is_public = true`.
4. The public page at `/track/[shareToken]` resolves the token → trip via RLS policies that allow
   anonymous `SELECT` only while `is_public = true` and the share isn't revoked/expired, then opens
   a Supabase Realtime channel subscribed to `postgres_changes` on `locations` for that `trip_id`.
   New pings stream straight to the map — no polling.
5. Ending the trip sets `status = 'ended'`, stops the watch, and turns sharing off.

**Security model for this phase:** a public link works like "anyone with the link," similar to an
unlisted document link — not enumerable, but not password-gated either. Password-protected,
one-time, and expiring links (already stubbed as `expires_at`/`revoked` columns) are Phase 2 work.

---

## 5. Deploying to Render (free tier)

1. Push this repo to GitHub.
2. In Render, **New → Blueprint**, point it at the repo — it will read `render.yaml`.
3. Set the environment variables Render prompts for (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` = your Render URL).
4. Deploy. Render builds with `npm ci && npm run build` and serves with `npm run start`, on the
   free web service plan, with automatic HTTPS and auto-deploy on every push to `main`.
5. Add the Render URL + `/auth/callback` to Supabase's redirect URL allow-list (step 3.1.4 above).

### Scaling later (no code changes required)
The app is stateless — all state lives in Supabase/Postgres, not in server memory — so it's safe
to run multiple instances. When you're ready to move off the free plan: bump `plan` in
`render.yaml` and increase instance count / enable autoscaling. Render's load balancer handles the
rest; nothing in the app needs to change.

---

## 6. What's intentionally not in Phase 1

Per the agreed roadmap, these are deferred so Phase 1 could be a real, fully working product
instead of a wide set of half-built features:

- **Phase 2:** QR sharing, password-protected/expiring links, route replay, ETA, notifications,
  admin dashboard, driver/vehicle management, analytics & reports.
- **Phase 3:** Fleet management, multi-tenancy, AI ETA/route suggestions, geofencing, full offline
  PWA support, public API, webhooks, white-label, enterprise features.

The schema already has the columns Phase 2 needs (`trip_shares.expires_at`, `.revoked`) so those
features extend the existing tables rather than requiring migrations that break Phase 1 data.

---

## 7. Testing strategy (for this phase)

- **CI (`.github/workflows/ci.yml`)**: `tsc --noEmit`, `next lint`, and a production build run on
  every push/PR, catching type errors and broken builds before merge.
- **Manual QA checklist** before each deploy:
  - Sign up / sign in via each enabled method
  - Start a session, grant location permission, confirm the map + stats update
  - Open the public link in an incognito window, confirm live updates arrive without refresh
  - Toggle the link off mid-session, confirm the public page stops updating
  - End the trip, confirm it appears correctly in Trip History
- Recommended next addition: Playwright end-to-end tests covering the flow above, plus Vitest unit
  tests for `src/lib/geo.ts` (pure functions, easy to test in isolation).

---

## 8. Accessibility & performance notes

- Visible focus rings globally (`:focus-visible` in `globals.css`); `prefers-reduced-motion` is
  respected for the live-pulse marker animation.
- Semantic form labels throughout auth and profile forms.
- `next/font` self-hosts Google Fonts (no runtime font-fetch waterfall); `output: "standalone"` in
  `next.config.js` keeps the Render build lean.
- Map tiles are fetched from a free public tile host — swap `NEXT_PUBLIC_MAP_STYLE_URL` if you
  later want a paid provider with an SLA.

## 9. Everything added beyond the original MVP

This build folds every remaining spec item into one integrated codebase (no phase folders, no
separate deliverables). What's here now, on top of the original MVP:

- **Admin dashboard** (`/admin`, role-gated via `profiles.role`): overview metrics + trend chart,
  fleet-wide live map, user management with role toggle, drivers/vehicles oversight, analytics
  (recharts) with CSV export, activity/audit logs, white-label branding settings.
- **Richer share links**: password-protected, one-time, expiring, and QR-code links, all resolved
  through `get_shared_trip`/`get_shared_locations` (SECURITY DEFINER functions) instead of raw
  table reads. **Trade-off:** non-password links get true Realtime (websocket) updates; password-
  protected links fall back to 4-second polling, because Realtime's `postgres_changes` subscriptions
  are authorized by RLS per-connection and can't easily be gated behind a one-time password check.
- **Route replay**: a scrubber (play/pause/speed) on both the owner and public tracking views, over
  the same location history used for live tracking — no separate storage needed.
- **Fleet management** (`/dashboard/fleet`): vehicles and drivers, assignable to a trip.
- **Fleet operations** (`/dashboard/fleet-ops`): fuel logs, maintenance reminders, expense tracking,
  vehicle health checks — owner-scoped, CSV-exportable.
- **Geofencing**: create a zone at your current location while tracking; enter/exit events are
  logged, generate an in-app notification, and can fire a webhook (see below).
- **SOS / emergency contacts**: one tap logs an alert and surfaces your emergency contacts with a
  prefilled WhatsApp message and `tel:` link containing your last known location.
- **Notifications**: an in-app, realtime notification bell, plus optional browser web-push (see
  PWA section below).
- **Public API + webhooks** (`/dashboard/developer`): hashed API keys (`tf_...`, bcrypt-style via
  `pgcrypto`) authorize `GET /api/v1/trips` and `GET /api/v1/trips/:id/locations`. Webhooks
  (`trip.started`, `trip.ended`, `geofence.enter/exit`) fire via Postgres → `pg_net`, both free on
  Supabase.
- **Multi-language (i18n)**: a real dictionary-based provider covering English, Hindi, and Tamil,
  applied to navigation, the profile page, and key landing/dashboard copy now, with the same
  `t("key")` pattern ready to extend to the rest of the UI.
- **PWA**: `public/sw.js` caches the app shell for offline resilience (tracking data itself is
  intentionally never cached, since stale locations would be actively misleading) and handles
  push notifications. Enable push from Profile → "Push notifications"; see the VAPID setup below.
- **Map layers**: satellite toggle (Esri World Imagery, free, attribution included), heatmap toggle
  over recorded points, and a places search box (OpenStreetMap Nominatim, free, rate-limited by
  their usage policy — fine for personal/low-volume use, swap providers if you scale up).

### What's explicitly out, and why
- **Live traffic layer**: no free, no-API-key traffic data source exists; every provider that has
  one (Google, HERE, TomTom) is paid. Not faked here.
- **Terrain/elevation layer**: free elevation tile sources are effectively nonexistent without an
  API key from a paid provider. Skipped for the same reason.
- **Multi-tenant organizations** (teams sharing one account): deliberately not built. A partially
  built tenancy/permissions layer is a worse foundation than none — this needs its own dedicated
  pass with its own migration and RLS review rather than being squeezed in.
- **"AI" ETA / route suggestions / travel insights**: implemented as real heuristic calculations
  (`src/lib/geo.ts`'s `estimateEtaMs`, moving averages, historical aggregates in Admin → Analytics),
  not a branded ML model — there's no free tier for hosted LLM/ML inference at any real volume, so
  labeling heuristics as "AI" would be overclaiming.

### Migration order
Run these in order against a fresh Supabase project (each is additive/idempotent):
`supabase/schema.sql` → `migrations/002_admin_fleet_sharing.sql` →
`migrations/003_app_settings.sql` → `migrations/004_webhooks_public_api.sql` →
`migrations/005_emergency_and_fleet_ops.sql` → `migrations/006_locale.sql`.

### Making yourself an admin
After signing up normally, run once in the Supabase SQL editor:
```sql
update public.profiles set role = 'admin' where id = '<your-user-id>';
```

### Web-push setup (optional)
1. `npx web-push generate-vapid-keys` (free, local, no account needed).
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in your app's env.
3. Deploy `supabase/functions/send-push` (`supabase functions deploy send-push`) and set its
   secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
4. In the Supabase dashboard, add a Database Webhook on `INSERT` into `public.notifications`
   pointed at the deployed function URL.

### A note on "builds successfully / typecheck / lint pass"
This code was written and reviewed by hand — there is no network access in the environment used to
write it, so `npm install` / `next build` / `tsc` / `eslint` could not be executed here to produce a
verified passing run. `.github/workflows/ci.yml` runs all four (install, typecheck, lint, build) on
every push — treat the first green run there as the actual verification gate, and treat this as a
careful best-effort draft until it's gone through that.

