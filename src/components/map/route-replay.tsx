"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface RouteReplayProps {
  pointCount: number;
  onIndexChange: (index: number) => void;
}

const SPEEDS = [1, 2, 4, 8];

export function RouteReplay({ pointCount, onIndexChange }: RouteReplayProps) {
  const [index, setIndex] = useState(Math.max(0, pointCount - 1));
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Keep the scrubber pinned to the latest point until the user takes control.
    if (!playing) setIndex(Math.max(0, pointCount - 1));
  }, [pointCount, playing]);

  useEffect(() => {
    onIndexChange(index);
  }, [index, onIndexChange]);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= pointCount - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 300 / SPEEDS[speedIdx]);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speedIdx, pointCount]);

  if (pointCount === 0) return null;

  return (
    <div className="flex items-center gap-3 border-t border-line bg-white px-4 py-3">
      <Button size="sm" variant="secondary" onClick={() => setPlaying((p) => !p)}>
        {playing ? "Pause" : "Replay"}
      </Button>
      <input
        type="range"
        min={0}
        max={Math.max(0, pointCount - 1)}
        value={index}
        onChange={(e) => {
          setPlaying(false);
          setIndex(Number(e.target.value));
        }}
        className="h-1.5 flex-1 accent-brand-500"
      />
      <button
        type="button"
        onClick={() => setSpeedIdx((s) => (s + 1) % SPEEDS.length)}
        className="w-10 shrink-0 rounded-lg bg-cloud px-2 py-1 text-xs font-mono font-medium"
      >
        {SPEEDS[speedIdx]}x
      </button>
    </div>
  );
}
