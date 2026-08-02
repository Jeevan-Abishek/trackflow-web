"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";
import { RouteReplay } from "@/components/map/route-replay";
import type { LocationPing, SharedTripResult } from "@/lib/types";
import { compassLabel, formatDistance, formatDuration, formatSpeed, haversineDistanceM } from "@/lib/geo";

const POLL_INTERVAL_MS = 4000;

type LoadState = "loading" | "password" | "error" | "ready";

export function PublicTracker({ shareToken }: { shareToken: string }) {
  const supabase = createClient();
  const [state, setState] = useState<LoadState>("loading");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [trip, setTrip] = useState<SharedTripResult | null>(null);
  const [locations, setLocations] = useState<LocationPing[]>([]);
  const [connected, setConnected] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const distanceRef = useRef(0);
  const [distance, setDistance] = useState(0);
  const passwordRef = useRef<string | undefined>(undefined);

  async function resolveShare(withPassword?: string) {
    const { data, error } = await supabase.rpc("get_shared_trip", {
      p_token: shareToken,
      p_password: withPassword ?? null,
    });
    const result = (data as SharedTripResult[] | null)?.[0];

    if (error || !result) {
      setState("error");
      setErrorReason("not_found");
      return;
    }
    if (result.requires_password && !result.ok) {
      setPasswordProtected(true);
      setState("password");
      if (withPassword) setErrorReason("wrong_password");
      return;
    }
    if (!result.ok) {
      setState("error");
      setErrorReason(result.reason);
      return;
    }

    passwordRef.current = withPassword;
    setTrip(result);
    distanceRef.current = result.total_distance_m ?? 0;
    setDistance(distanceRef.current);

    const { data: locs } = await supabase.rpc("get_shared_locations", {
      p_token: shareToken,
      p_password: withPassword ?? null,
    });
    setLocations((locs as LocationPing[] | null) ?? []);
    setState("ready");
  }

  useEffect(() => {
    resolveShare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  // Realtime (no password) or polling (password-protected — see README for the trade-off).
  useEffect(() => {
    if (state !== "ready" || !trip?.trip_id) return;

    if (!passwordProtected) {
      const channel = supabase
        .channel(`public-trip-${trip.trip_id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "locations", filter: `trip_id=eq.${trip.trip_id}` },
          (payload) => {
            const point = payload.new as LocationPing;
            setLocations((prev) => {
              const prevLast = prev[prev.length - 1];
              if (prevLast) {
                distanceRef.current += haversineDistanceM(prevLast, point);
                setDistance(distanceRef.current);
              }
              return [...prev, point];
            });
          }
        )
        .subscribe((subStatus) => setConnected(subStatus === "SUBSCRIBED"));

      return () => {
        supabase.removeChannel(channel);
      };
    }

    setConnected(true);
    const poll = setInterval(async () => {
      const last = locations[locations.length - 1];
      const { data: locs } = await supabase.rpc("get_shared_locations", {
        p_token: shareToken,
        p_password: passwordRef.current ?? null,
        p_since: last?.recorded_at ?? null,
      });
      const fresh = (locs as LocationPing[] | null) ?? [];
      if (fresh.length > 0) {
        setLocations((prev) => {
          let d = distanceRef.current;
          let prevLast = prev[prev.length - 1];
          for (const point of fresh) {
            if (prevLast) d += haversineDistanceM(prevLast, point);
            prevLast = point;
          }
          distanceRef.current = d;
          setDistance(d);
          return [...prev, ...fresh];
        });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, trip?.trip_id, passwordProtected]);

  if (state === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-mist text-sm text-ink/50">Loading…</div>;
  }

  if (state === "password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist px-4">
        <Card className="w-full max-w-sm">
          <h1 className="mb-1 font-display text-lg font-semibold">Password required</h1>
          <p className="mb-4 text-sm text-ink/60">This tracking link is protected. Enter the password to continue.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              resolveShare(password);
            }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="link-password">Password</Label>
              <Input id="link-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {errorReason === "wrong_password" && <p className="text-sm text-danger-500">Incorrect password.</p>}
            <Button type="submit" className="w-full">
              Unlock
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    const messages: Record<string, string> = {
      not_found: "This link doesn't exist.",
      expired: "This link has expired.",
      view_limit_reached: "This one-time link has already been used.",
      not_public: "Sharing has been turned off for this trip.",
    };
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-mist px-4 text-center">
        <h1 className="font-display text-xl font-semibold">Can't open this link</h1>
        <p className="text-sm text-ink/60">{messages[errorReason ?? ""] ?? "Something went wrong."}</p>
      </div>
    );
  }

  const last = locations[replayIndex] ?? locations[locations.length - 1];
  const ended = trip?.status === "ended";

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="font-display text-lg font-semibold tracking-tight">TrackFlow</span>
          </div>
          <Badge tone={ended ? "ended" : connected ? "live" : "warn"}>
            {ended ? "Trip ended" : connected ? "Live" : "Connecting…"}
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1fr_340px]">
        <Card className="h-[60vh] overflow-hidden p-0 lg:h-[calc(100vh-140px)]">
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <LiveMap
                points={locations.slice(0, replayIndex + 1).map((l) => ({ lat: l.lat, lng: l.lng, heading: l.heading }))}
              />
            </div>
            <RouteReplay pointCount={locations.length} onIndexChange={setReplayIndex} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h1 className="mb-4 font-display text-lg font-semibold">{trip?.title}</h1>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-ink/50">Speed</dt>
              <dd className="text-right font-mono">{formatSpeed(last?.speed_kmh ?? 0)}</dd>
              <dt className="text-ink/50">Heading</dt>
              <dd className="text-right font-mono">
                {last?.heading != null ? `${Math.round(last.heading)}° ${compassLabel(last.heading)}` : "—"}
              </dd>
              <dt className="text-ink/50">Distance</dt>
              <dd className="text-right font-mono">{formatDistance(distance)}</dd>
              <dt className="text-ink/50">Elapsed</dt>
              <dd className="text-right font-mono">
                {trip &&
                  formatDuration(
                    (trip.ended_at ? new Date(trip.ended_at).getTime() : Date.now()) -
                      new Date(trip.started_at as string).getTime()
                  )}
              </dd>
              <dt className="text-ink/50">Last update</dt>
              <dd className="text-right font-mono">{last ? new Date(last.recorded_at).toLocaleTimeString() : "—"}</dd>
            </dl>
          </Card>
          <p className="px-1 text-xs text-ink/40">
            This link was shared by the trip owner and can be turned off by them at any time.
          </p>
        </div>
      </main>
    </div>
  );
}
