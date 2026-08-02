"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { Driver, Vehicle } from "@/lib/types";

export function FleetManager({
  initialVehicles,
  initialDrivers,
  ownerId,
}: {
  initialVehicles: Vehicle[];
  initialDrivers: Driver[];
  ownerId: string;
}) {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [drivers, setDrivers] = useState(initialDrivers);

  const [vehicleName, setVehicleName] = useState("");
  const [vehicleType, setVehicleType] = useState<Vehicle["vehicle_type"]>("car");
  const [plate, setPlate] = useState("");

  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [license, setLicense] = useState("");
  const [assignedVehicle, setAssignedVehicle] = useState("");

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleName.trim()) return;
    const { data } = await supabase
      .from("vehicles")
      .insert({ owner_id: ownerId, name: vehicleName, vehicle_type: vehicleType, plate_number: plate || null })
      .select()
      .single();
    if (data) setVehicles((v) => [data, ...v]);
    setVehicleName("");
    setPlate("");
  }

  async function removeVehicle(id: string) {
    await supabase.from("vehicles").delete().eq("id", id);
    setVehicles((v) => v.filter((x) => x.id !== id));
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault();
    if (!driverName.trim()) return;
    const { data } = await supabase
      .from("drivers")
      .insert({
        owner_id: ownerId,
        full_name: driverName,
        phone: driverPhone || null,
        license_number: license || null,
        vehicle_id: assignedVehicle || null,
      })
      .select()
      .single();
    if (data) setDrivers((d) => [data, ...d]);
    setDriverName("");
    setDriverPhone("");
    setLicense("");
    setAssignedVehicle("");
  }

  async function removeDriver(id: string) {
    await supabase.from("drivers").delete().eq("id", id);
    setDrivers((d) => d.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Fleet</h1>
        <p className="mt-1 text-sm text-ink/60">Manage the vehicles and drivers you can attach to a trip.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-medium">Vehicles</h2>
          <form onSubmit={addVehicle} className="mb-5 space-y-3">
            <div>
              <Label htmlFor="vehicle-name">Name</Label>
              <Input id="vehicle-name" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vehicle-type">Type</Label>
                <select
                  id="vehicle-type"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as Vehicle["vehicle_type"])}
                  className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
                >
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="plate">Plate number</Label>
                <Input id="plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
              </div>
            </div>
            <Button type="submit" size="sm">
              Add vehicle
            </Button>
          </form>
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{v.name}</span>
                  <span className="ml-2 text-ink/50">
                    {v.vehicle_type} {v.plate_number ? `· ${v.plate_number}` : ""}
                  </span>
                </div>
                <button onClick={() => removeVehicle(v.id)} className="text-xs text-danger-500">
                  Remove
                </button>
              </div>
            ))}
            {vehicles.length === 0 && <p className="text-sm text-ink/50">No vehicles yet.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Drivers</h2>
          <form onSubmit={addDriver} className="mb-5 space-y-3">
            <div>
              <Label htmlFor="driver-name">Name</Label>
              <Input id="driver-name" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="driver-phone">Phone</Label>
                <Input id="driver-phone" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="license">License #</Label>
                <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="assign-vehicle">Assign vehicle</Label>
              <select
                id="assign-vehicle"
                value={assignedVehicle}
                onChange={(e) => setAssignedVehicle(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
              >
                <option value="">None</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              Add driver
            </Button>
          </form>
          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{d.full_name}</span>
                  <span className="ml-2 text-ink/50">Score {d.score.toFixed(0)}</span>
                </div>
                <button onClick={() => removeDriver(d.id)} className="text-xs text-danger-500">
                  Remove
                </button>
              </div>
            ))}
            {drivers.length === 0 && <p className="text-sm text-ink/50">No drivers yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
