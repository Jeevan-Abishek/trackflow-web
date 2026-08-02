"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

export function AdminLiveMap({ points }: { points: { lat: number; lng: number; heading: number | null }[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center: [number, number] = points.length > 0 ? [points[0].lng, points[0].lat] : [77.209, 28.6139];
    const map = new maplibregl.Map({ container: containerRef.current, style: STYLE_URL, center, zoom: 11 });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = points.map((p) => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:9999px;background:#2563EB;border:2px solid white;box-shadow:0 1px 4px rgba(15,23,42,0.4);";
      return new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
    });

    if (points.length > 0) {
      const bounds = points.reduce(
        (b, p) => b.extend([p.lng, p.lat]),
        new maplibregl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat])
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 500 });
    }
  }, [points]);

  return <div ref={containerRef} className="h-full w-full" />;
}
