"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/app/admin/export-button";
import type {
  ExpenseLog,
  FuelLog,
  MaintenanceReminder,
  Vehicle,
  VehicleHealthLog,
} from "@/lib/types";

type Tab = "fuel" | "maintenance" | "expenses" | "health";

export function FleetOpsManager({
  ownerId,
  vehicles,
  initialFuel,
  initialMaintenance,
  initialExpenses,
  initialHealth,
}: {
  ownerId: string;
  vehicles: Vehicle[];
  initialFuel: FuelLog[];
  initialMaintenance: MaintenanceReminder[];
  initialExpenses: ExpenseLog[];
  initialHealth: VehicleHealthLog[];
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("fuel");
  const [fuel, setFuel] = useState(initialFuel);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [health, setHealth] = useState(initialHealth);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");

  const vehicleName = (id: string | null) => vehicles.find((v) => v.id === id)?.name ?? "—";

  async function addFuel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vehicleId) return;
    const form = new FormData(e.currentTarget);
    const { data } = await supabase
      .from("fuel_logs")
      .insert({
        owner_id: ownerId,
        vehicle_id: vehicleId,
        liters: Number(form.get("liters")),
        cost: Number(form.get("cost")),
        odometer_km: form.get("odometer") ? Number(form.get("odometer")) : null,
      })
      .select()
      .single();
    if (data) setFuel((p) => [data, ...p]);
    e.currentTarget.reset();
  }

  async function addMaintenance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vehicleId) return;
    const form = new FormData(e.currentTarget);
    const { data } = await supabase
      .from("maintenance_reminders")
      .insert({
        owner_id: ownerId,
        vehicle_id: vehicleId,
        title: String(form.get("title")),
        due_date: (form.get("due_date") as string) || null,
      })
      .select()
      .single();
    if (data) setMaintenance((p) => [data, ...p]);
    e.currentTarget.reset();
  }

  async function toggleMaintenance(id: string, completed: boolean) {
    const { data } = await supabase
      .from("maintenance_reminders")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
      .single();
    if (data) setMaintenance((p) => p.map((m) => (m.id === id ? data : m)));
  }

  async function addExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { data } = await supabase
      .from("expense_logs")
      .insert({
        owner_id: ownerId,
        vehicle_id: vehicleId || null,
        category: form.get("category") as ExpenseLog["category"],
        amount: Number(form.get("amount")),
        note: (form.get("note") as string) || null,
      })
      .select()
      .single();
    if (data) setExpenses((p) => [data, ...p]);
    e.currentTarget.reset();
  }

  async function addHealth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vehicleId) return;
    const form = new FormData(e.currentTarget);
    const { data } = await supabase
      .from("vehicle_health_logs")
      .insert({
        owner_id: ownerId,
        vehicle_id: vehicleId,
        odometer_km: form.get("odometer") ? Number(form.get("odometer")) : null,
        tire_condition: form.get("tire") as VehicleHealthLog["tire_condition"],
        engine_status: form.get("engine") as VehicleHealthLog["engine_status"],
      })
      .select()
      .single();
    if (data) setHealth((p) => [data, ...p]);
    e.currentTarget.reset();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "fuel", label: "Fuel log" },
    { id: "maintenance", label: "Maintenance" },
    { id: "expenses", label: "Expenses" },
    { id: "health", label: "Vehicle health" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Fleet operations</h1>
          <p className="mt-1 text-sm text-ink/60">Fuel, maintenance, expenses, and health checks per vehicle.</p>
        </div>
        {vehicles.length > 0 && (
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="h-10 rounded-xl border border-line bg-white px-3 text-sm"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {vehicles.length === 0 && (
        <Card className="text-sm text-ink/60">
          Add a vehicle on the <a href="/dashboard/fleet" className="text-brand-500">Fleet</a> page first.
        </Card>
      )}

      <div className="flex gap-1 rounded-xl bg-cloud p-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-1.5 font-medium transition-colors ${
              tab === t.id ? "bg-white shadow-card" : "text-ink/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fuel" && (
        <Card>
          <form onSubmit={addFuel} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input name="liters" type="number" step="0.01" placeholder="Liters" required />
            <Input name="cost" type="number" step="0.01" placeholder="Cost (₹)" required />
            <Input name="odometer" type="number" step="0.1" placeholder="Odometer (km)" />
            <Button type="submit" size="sm">
              Log fuel
            </Button>
          </form>
          <div className="flex justify-end pb-2">
            <ExportButton filename="fuel-logs" rows={fuel} />
          </div>
          <LogTable
            rows={fuel}
            columns={[
              { key: "logged_at", label: "Date", render: (r) => new Date(r.logged_at).toLocaleDateString() },
              { key: "vehicle_id", label: "Vehicle", render: (r) => vehicleName(r.vehicle_id) },
              { key: "liters", label: "Liters" },
              { key: "cost", label: "Cost (₹)" },
              { key: "odometer_km", label: "Odometer" },
            ]}
          />
        </Card>
      )}

      {tab === "maintenance" && (
        <Card>
          <form onSubmit={addMaintenance} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input name="title" placeholder="e.g. Oil change" required />
            <Input name="due_date" type="date" />
            <Button type="submit" size="sm">
              Add reminder
            </Button>
          </form>
          <div className="space-y-2">
            {maintenance.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                <div>
                  <span className={m.completed ? "text-ink/40 line-through" : "font-medium"}>{m.title}</span>
                  <span className="ml-2 text-ink/50">{vehicleName(m.vehicle_id)}</span>
                  {m.due_date && <span className="ml-2 text-ink/50">due {new Date(m.due_date).toLocaleDateString()}</span>}
                </div>
                <button onClick={() => toggleMaintenance(m.id, m.completed)} className="text-xs text-brand-500">
                  {m.completed ? "Reopen" : "Mark done"}
                </button>
              </div>
            ))}
            {maintenance.length === 0 && <p className="text-sm text-ink/50">No reminders yet.</p>}
          </div>
        </Card>
      )}

      {tab === "expenses" && (
        <Card>
          <form onSubmit={addExpense} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <select name="category" className="h-11 rounded-xl border border-line bg-white px-3 text-sm" required>
              <option value="fuel">Fuel</option>
              <option value="maintenance">Maintenance</option>
              <option value="toll">Toll</option>
              <option value="parking">Parking</option>
              <option value="other">Other</option>
            </select>
            <Input name="amount" type="number" step="0.01" placeholder="Amount (₹)" required />
            <Input name="note" placeholder="Note (optional)" />
            <Button type="submit" size="sm">
              Log expense
            </Button>
          </form>
          <div className="flex justify-end pb-2">
            <ExportButton filename="expenses" rows={expenses} />
          </div>
          <LogTable
            rows={expenses}
            columns={[
              { key: "logged_at", label: "Date", render: (r) => new Date(r.logged_at).toLocaleDateString() },
              { key: "category", label: "Category" },
              { key: "amount", label: "Amount (₹)" },
              { key: "note", label: "Note" },
            ]}
          />
        </Card>
      )}

      {tab === "health" && (
        <Card>
          <form onSubmit={addHealth} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input name="odometer" type="number" step="0.1" placeholder="Odometer (km)" />
            <select name="tire" className="h-11 rounded-xl border border-line bg-white px-3 text-sm">
              <option value="good">Tires: good</option>
              <option value="worn">Tires: worn</option>
              <option value="needs_replacement">Tires: replace</option>
            </select>
            <select name="engine" className="h-11 rounded-xl border border-line bg-white px-3 text-sm">
              <option value="good">Engine: good</option>
              <option value="warning">Engine: warning</option>
              <option value="critical">Engine: critical</option>
            </select>
            <Button type="submit" size="sm">
              Log check
            </Button>
          </form>
          <div className="space-y-2">
            {health.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                <span>
                  {vehicleName(h.vehicle_id)} · {new Date(h.logged_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  {h.tire_condition && (
                    <Badge tone={h.tire_condition === "good" ? "live" : h.tire_condition === "worn" ? "warn" : "ended"}>
                      tires: {h.tire_condition}
                    </Badge>
                  )}
                  {h.engine_status && (
                    <Badge tone={h.engine_status === "good" ? "live" : h.engine_status === "warning" ? "warn" : "ended"}>
                      engine: {h.engine_status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {health.length === 0 && <p className="text-sm text-ink/50">No health checks logged yet.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}

function LogTable<T extends object>({
  rows,
  columns,
}: {
  rows: T[];
  columns: { key: keyof T & string; label: string; render?: (row: T) => React.ReactNode }[];
}) {
  if (rows.length === 0) return <p className="text-sm text-ink/50">Nothing logged yet.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left text-ink/50">
          {columns.map((c) => (
            <th key={c.key} className="px-2 py-2 font-medium">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line last:border-0">
            {columns.map((c) => (
              <td key={c.key} className="px-2 py-2 text-ink/70">
                {c.render ? c.render(r) : String(r[c.key] ?? "—")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
