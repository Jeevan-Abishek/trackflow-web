"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";
import { SharePanel } from "./share-panel";
import { RouteReplay } from "@/components/map/route-replay";
import { SosPanel } from "@/components/sos-panel";
import { GeofencePanel } from "./geofence-panel";
import type { EmergencyContact, Geofence, LocationPing, Trip, TripShare } from "@/lib/types";
import { compassLabel, formatDistance, formatDuration, formatSpeed, haversineDistanceM } from "@/lib/geo";

const MIN_PING_INTERVAL_MS = 3000;

export function TripTracker({
  trip,
  initialLocations,
  initialShare,
  geofences,
  emergencyContacts,
}: {
  trip: Trip;
  initialLocations: LocationPing[];
  initialShare: TripShare | null;
  geofences: Geofence[];
  emergencyContacts: EmergencyContact[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [locations, setLocations] = useState<LocationPing[]>(initialLocations);
  const [share, setShare] = useState<TripShare | null>(initialShare);
  const [isPublic, setIsPublic] = useState(trip.is_public);
  const [tracking, setTracking] = useState(trip.status === "active");
  const [online, setOnline] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [ended, setEnded] = useState(trip.status === "ended");
  const [fences, setFences] = useState(geofences);
  const insideFenceRef = useRef<Record<string, boolean>>({});

  const lastInsertRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const statsRef = useRef({
    distanceM: trip.total_distance_m,
    maxKmh: trip.max_speed_kmh,
    speedSum: 0,
    speedCount: 0,
  });
  const [stats, setStats] = useState(statsRef.current);
  const [replayIndex, setReplayIndex] = useState(0);

  // Online/offline detection.
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Geolocation watch loop.
  useEffect(() => {
    if (!tracking || ended) return;
    if (!("geolocation" in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        setGpsAccuracy(pos.coords.accuracy);
        if (now - lastInsertRef.current < MIN_PING_INTERVAL_MS) return;
        lastInsertRef.current = now;

        const speedMs = pos.coords.speed ?? 0;
        const speedKmh = Math.max(0, speedMs * 3.6);

        setLocations((prev) => {
          const prevLast = prev[prev.length - 1];
          const next: LocationPing = {
            id: -now,
            trip_id: trip.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed_kmh: speedKmh,
            heading: pos.coords.heading,
            accuracy_m: pos.coords.accuracy,
            recorded_at: new Date(now).toISOString(),
          };
          if (prevLast) {
            statsRef.current.distanceM += haversineDistanceM(prevLast, next);
          }
          statsRef.current.maxKmh = Math.max(statsRef.current.maxKmh, speedKmh);
          statsRef.current.speedSum += speedKmh;
          statsRef.current.speedCount += 1;
          setStats({ ...statsRef.current });
          return [...prev, next];
        });

        void supabase.from("locations").insert({
          trip_id: trip.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed_kmh: speedKmh,
          heading: pos.coords.heading,
          accuracy_m: pos.coords.accuracy,
        });

        void supabase
          .from("trips")
          .update({
            total_distance_m: statsRef.current.distanceM,
            max_speed_kmh: statsRef.current.maxKmh,
            avg_speed_kmh: statsRef.current.speedCount
              ? statsRef.current.speedSum / statsRef.current.speedCount
              : 0,
          })
          .eq("id", trip.id);

        for (const fence of fences) {
          const distance = haversineDistanceM(
            { lat: fence.center_lat, lng: fence.center_lng },
            { lat: pos.coords.latitude, lng: pos.coords.longitude }
          );
          const isInside = distance <= fence.radius_m;
          const wasInside = insideFenceRef.current[fence.id] ?? false;
          if (isInside !== wasInside) {
            insideFenceRef.current[fence.id] = isInside;
            void supabase.from("geofence_events").insert({
              geofence_id: fence.id,
              trip_id: trip.id,
              event_type: isInside ? "enter" : "exit",
            });
            void supabase.from("notifications").insert({
              owner_id: trip.owner_id,
              title: `${isInside ? "Entered" : "Exited"} ${fence.name}`,
              severity: "info",
            });
          }
        }
      },
      (err) => console.error("Geolocation error", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [tracking, ended, supabase, trip.id, fences]);

  async function handleEndTrip() {
    setTracking(false);
    setEnded(true);
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    await supabase
      .from("trips")
      .update({ status: "ended", ended_at: new Date().toISOString(), is_public: false })
      .eq("id", trip.id);
    setIsPublic(false);
    router.refresh();
  }

  const lastPoint = locations[locations.length - 1];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card className="h-[60vh] overflow-hidden p-0 lg:h-[calc(100vh-160px)]">
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <LiveMap
              points={locations
                .slice(0, replayIndex + 1)
                .map((l) => ({ lat: l.lat, lng: l.lng, heading: l.heading }))}
            />
          </div>
          <RouteReplay pointCount={locations.length} onIndexChange={setReplayIndex} />
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-display text-lg font-semibold">{trip.title}</h1>
            <Badge tone={ended ? "ended" : "live"}>{ended ? "Ended" : "Live"}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-ink/50">Speed</dt>
            <dd className="text-right font-mono">
              {formatSpeed(lastPoint?.speed_kmh ?? 0)}
            </dd>
            <dt className="text-ink/50">Heading</dt>
            <dd className="text-right font-mono">
              {lastPoint?.heading != null ? `${Math.round(lastPoint.heading)}° ${compassLabel(lastPoint.heading)}` : "—"}
            </dd>
            <dt className="text-ink/50">Distance</dt>
            <dd className="text-right font-mono">{formatDistance(stats.distanceM)}</dd>
            <dt className="text-ink/50">Max speed</dt>
            <dd className="text-right font-mono">{formatSpeed(stats.maxKmh)}</dd>
            <dt className="text-ink/50">Avg speed</dt>
            <dd className="text-right font-mono">
              {formatSpeed(stats.speedCount ? stats.speedSum / stats.speedCount : 0)}
            </dd>
            <dt className="text-ink/50">Elapsed</dt>
            <dd className="text-right font-mono">
              {formatDuration(Date.now() - new Date(trip.started_at).getTime())}
            </dd>
            <dt className="text-ink/50">GPS accuracy</dt>
            <dd className="text-right font-mono">{gpsAccuracy ? `±${Math.round(gpsAccuracy)} m` : "—"}</dd>
            <dt className="text-ink/50">Connection</dt>
            <dd className="text-right">
              <Badge tone={online ? "live" : "warn"}>{online ? "Online" : "Offline"}</Badge>
            </dd>
          </dl>
        </Card>

        {!ended && (
          <SosPanel
            ownerId={trip.owner_id}
            contacts={emergencyContacts}
            currentLat={lastPoint?.lat ?? null}
            currentLng={lastPoint?.lng ?? null}
          />
        )}

        {!ended && (
          <SharePanel trip={trip} isPublic={isPublic} share={share} onPublicChange={setIsPublic} onShareChange={setShare} />
        )}

        {!ended && (
          <GeofencePanel
            tripId={trip.id}
            ownerId={trip.owner_id}
            fences={fences}
            currentLat={lastPoint?.lat ?? null}
            currentLng={lastPoint?.lng ?? null}
            onFencesChange={setFences}
          />
        )}

        {!ended && (
          <Button variant="danger" className="w-full" onClick={handleEndTrip}>
            End trip
          </Button>
        )}
      </div>
    </div>
  );
}
