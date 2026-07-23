"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DAYS_OF_WEEK } from "@/lib/constants";
import SectorFields, { EMPTY_SECTOR, sectorNeedsZone, type SectorValue } from "@/components/SectorFields";

type OfficeHourRow = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

function emptySchedule(): Record<number, OfficeHourRow> {
  return Object.fromEntries(
    DAYS_OF_WEEK.map((d) => [d.value, { enabled: false, openTime: "08:00", closeTime: "17:00" }])
  );
}

export default function DoctorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [address, setAddress] = useState("");
  const [sector, setSector] = useState<SectorValue>(EMPTY_SECTOR);
  const [phone, setPhone] = useState("");
  const [dailyCapacity, setDailyCapacity] = useState("1");
  const [notes, setNotes] = useState("");
  const [schedule, setSchedule] = useState<Record<number, OfficeHourRow>>(emptySchedule());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function updateDay(day: number, patch: Partial<OfficeHourRow>) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !address || !sector.department || !sector.municipality) {
      setError("Nombre, dirección y sector son obligatorios.");
      return;
    }
    if (sectorNeedsZone(sector) && !sector.zone) {
      setError("Selecciona la zona de la Ciudad de Guatemala.");
      return;
    }

    const officeHours = DAYS_OF_WEEK.filter((d) => schedule[d.value].enabled).map((d) => ({
      dayOfWeek: d.value,
      openTime: schedule[d.value].openTime,
      closeTime: schedule[d.value].closeTime,
    }));

    if (officeHours.length === 0) {
      setError("Selecciona al menos un día de atención.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          specialty: specialty || undefined,
          address,
          department: sector.department,
          municipality: sector.municipality,
          zone: sector.zone ? Number(sector.zone) : undefined,
          phone: phone || undefined,
          notes: notes || undefined,
          dailyCapacity: Number(dailyCapacity) || 1,
          officeHours,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear el médico");
      }
      setName("");
      setSpecialty("");
      setAddress("");
      setSector(EMPTY_SECTOR);
      setPhone("");
      setDailyCapacity("1");
      setNotes("");
      setSchedule(emptySchedule());
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
      >
        + Agregar médico
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-4"
    >
      <div className="flex justify-between items-center">
        <h2 className="font-medium">Nuevo médico</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Cancelar
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Nombre *
          <input
            className="border rounded px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Especialidad
          <input
            className="border rounded px-2 py-1"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Dirección *
          <input
            className="border rounded px-2 py-1"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="6a Avenida 10-25, Zona 10"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Teléfono
          <input
            className="border rounded px-2 py-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Capacidad diaria (visitadores atendidos por día)
          <input
            type="number"
            min={1}
            className="border rounded px-2 py-1"
            value={dailyCapacity}
            onChange={(e) => setDailyCapacity(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Notas
          <textarea
            className="border rounded px-2 py-1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      <SectorFields value={sector} onChange={setSector} />

      <div>
        <h3 className="text-sm font-medium mb-2">Días y horario de atención *</h3>
        <div className="flex flex-col gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.value} className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2 w-28">
                <input
                  type="checkbox"
                  checked={schedule[day.value].enabled}
                  onChange={(e) => updateDay(day.value, { enabled: e.target.checked })}
                />
                {day.label}
              </label>
              <input
                type="time"
                className="border rounded px-2 py-1 disabled:bg-slate-100"
                value={schedule[day.value].openTime}
                disabled={!schedule[day.value].enabled}
                onChange={(e) => updateDay(day.value, { openTime: e.target.value })}
              />
              <span>a</span>
              <input
                type="time"
                className="border rounded px-2 py-1 disabled:bg-slate-100"
                value={schedule[day.value].closeTime}
                disabled={!schedule[day.value].enabled}
                onChange={(e) => updateDay(day.value, { closeTime: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : "Guardar médico"}
      </button>
    </form>
  );
}
