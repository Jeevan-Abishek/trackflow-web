"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function TripsTrendChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-ink/50">No trips yet.</p>;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#E4E8EE" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4E8EE" }} />
          <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
