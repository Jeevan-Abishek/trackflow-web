"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface TrackPoint {
  lat: number;
  lng: number;
  heading?: number | null;
}

interface LiveMapProps {
  points: TrackPoint[];
  follow?: boolean;
  className?: string;
}

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

const ROUTE_SOURCE_ID = "trackflow-route";
const ROUTE_LAYER_ID = "trackflow-route-line";
const POINTS_SOURCE_ID = "trackflow-points";
const HEATMAP_LAYER_ID = "trackflow-heatmap";
const SATELLITE_SOURCE_ID = "trackflow-satellite";
const SATELLITE_LAYER_ID = "trackflow-satellite-layer";
const SEARCH_MARKER_COLOR = "#F59E0B";

export function LiveMap({ points, follow = true, className }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [heatmap, setHeatmap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] =
      points.length > 0 ? [points[points.length - 1].lng, points[points.length - 1].lat] : [77.209, 28.6139];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: initialCenter,
      zoom: 15,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");

    map.on("load", () => {
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#2563EB", "line-width": 4, "line-opacity": 0.85 },
      });

      map.addSource(POINTS_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: HEATMAP_LAYER_ID,
        type: "heatmap",
        source: POINTS_SOURCE_ID,
        layout: { visibility: "none" },
        paint: {
          "heatmap-weight": 0.6,
          "heatmap-intensity": 1,
          "heatmap-radius": 24,
          "heatmap-opacity": 0.7,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(37,99,235,0)",
            0.5,
            "#93C5FD",
            1,
            "#2563EB",
          ],
        },
      });

      // Free satellite imagery (Esri World Imagery) — attribution required, no API key.
      map.addSource(SATELLITE_SOURCE_ID, {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri World Imagery",
      });
      map.addLayer({ id: SATELLITE_LAYER_ID, type: "raster", source: SATELLITE_SOURCE_ID, layout: { visibility: "none" } });
    });

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:-10px;border-radius:9999px;background:rgba(37,99,235,0.25);animation:pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite;"></div>
        <div style="position:absolute;inset:0;border-radius:9999px;background:#2563EB;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,0.35);"></div>
      </div>`;
    markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(initialCenter).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker + route + heatmap points whenever points change.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || points.length === 0) return;

    const last = points[points.length - 1];
    marker.setLngLat([last.lng, last.lat]);

    const applyData = () => {
      const routeSource = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      routeSource?.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: points.map((p) => [p.lng, p.lat]) },
      });

      const pointsSource = map.getSource(POINTS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      pointsSource?.setData({
        type: "FeatureCollection",
        features: points.map((p) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        })),
      });
    };

    if (map.isStyleLoaded()) applyData();
    else map.once("load", applyData);

    if (follow) {
      map.easeTo({ center: [last.lng, last.lat], duration: 800 });
    }
  }, [points, follow]);

  function toggleSatellite() {
    const map = mapRef.current;
    if (!map) return;
    const next = !satellite;
    setSatellite(next);
    if (map.getLayer(SATELLITE_LAYER_ID)) {
      map.setLayoutProperty(SATELLITE_LAYER_ID, "visibility", next ? "visible" : "none");
    }
  }

  function toggleHeatmap() {
    const map = mapRef.current;
    if (!map) return;
    const next = !heatmap;
    setHeatmap(next);
    if (map.getLayer(HEATMAP_LAYER_ID)) {
      map.setLayoutProperty(HEATMAP_LAYER_ID, "visibility", next ? "visible" : "none");
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const map = mapRef.current;
    if (!map || !searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`,
        { headers: { Accept: "application/json" } }
      );
      const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      const first = results[0];
      if (first) {
        const lngLat: [number, number] = [Number(first.lon), Number(first.lat)];
        map.flyTo({ center: lngLat, zoom: 14 });
        searchMarkerRef.current?.remove();
        searchMarkerRef.current = new maplibregl.Marker({ color: SEARCH_MARKER_COLOR }).setLngLat(lngLat).addTo(map);
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className={`relative ${className ?? "h-full w-full"}`}>
      <div ref={containerRef} className="h-full w-full" />
      <form onSubmit={handleSearch} className="absolute left-3 top-3 z-10 flex w-64 max-w-[70%] gap-1">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search places…"
          className="h-9 flex-1 rounded-lg border border-line bg-white/95 px-3 text-xs shadow-card backdrop-blur"
        />
      </form>
      <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={toggleSatellite}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-card ${
            satellite ? "bg-brand-500 text-white" : "bg-white/95 text-ink"
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={toggleHeatmap}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-card ${
            heatmap ? "bg-brand-500 text-white" : "bg-white/95 text-ink"
          }`}
        >
          Heatmap
        </button>
      </div>
    </div>
  );
}
