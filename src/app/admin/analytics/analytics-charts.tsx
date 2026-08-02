"use client";

import { Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AnalyticsCharts({ data }: { data: { week: string; distanceKm: number; trips: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-ink/50">Not enough data yet.</p>;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#E4E8EE" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4E8EE" }} />
          <Bar dataKey="distanceKm" name="Distance (km)" fill="#93C5FD" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="trips" name="Trips" stroke="#10B981" strokeWidth={2} dot={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
