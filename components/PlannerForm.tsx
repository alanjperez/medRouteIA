"use client";

import { useState } from "react";
import { DAYS_OF_WEEK } from "@/lib/constants";
import type { PlannerResult } from "@/lib/planner";

type DoctorOption = { id: number; name: string };

function mondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];

export default function PlannerForm({ doctors }: { doctors: DoctorOption[] }) {
  const [homeLatitude, setHomeLatitude] = useState("");
  const [homeLongitude, setHomeLongitude] = useState("");
  const [weekStartDate, setWeekStartDate] = useState(mondayOfCurrentWeek());
  const [workDays, setWorkDays] = useState<number[]>(DEFAULT_WORK_DAYS);
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("17:00");
  const [defaultVisitMinutes, setDefaultVisitMinutes] = useState("20");
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>(doctors.map((d) => d.id));
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleWorkDay(day: number) {
    setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function toggleDoctor(id: number) {
    setSelectedDoctorIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const lat = Number(homeLatitude);
    const lng = Number(homeLongitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Ingresa latitud y longitud válidas para tu punto de partida.");
      return;
    }
    if (selectedDoctorIds.length === 0) {
      setError("Selecciona al menos un médico para planificar.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeLatitude: lat,
          homeLongitude: lng,
          weekStartDate,
          workDays,
          dayStart,
          dayEnd,
          defaultVisitMinutes: Number(defaultVisitMinutes) || 20,
          doctorIds: selectedDoctorIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo generar el plan");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Latitud de tu punto de partida *
            <input
              className="border rounded px-2 py-1"
              value={homeLatitude}
              onChange={(e) => setHomeLatitude(e.target.value)}
              placeholder="14.6349"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Longitud de tu punto de partida *
            <input
              className="border rounded px-2 py-1"
              value={homeLongitude}
              onChange={(e) => setHomeLongitude(e.target.value)}
              placeholder="-90.5069"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Semana (lunes de inicio)
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Duración por defecto sin historial (min)
            <input
              type="number"
              min={5}
              className="border rounded px-2 py-1"
              value={defaultVisitMinutes}
              onChange={(e) => setDefaultVisitMinutes(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Inicio de jornada
            <input
              type="time"
              className="border rounded px-2 py-1"
              value={dayStart}
              onChange={(e) => setDayStart(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fin de jornada
            <input
              type="time"
              className="border rounded px-2 py-1"
              value={dayEnd}
              onChange={(e) => setDayEnd(e.target.value)}
            />
          </label>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Días laborables</h3>
          <div className="flex gap-3 flex-wrap">
            {DAYS_OF_WEEK.map((d) => (
              <label key={d.value} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={workDays.includes(d.value)}
                  onChange={() => toggleWorkDay(d.value)}
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Médicos a incluir</h3>
          {doctors.length === 0 ? (
            <p className="text-sm text-slate-600">No hay médicos registrados.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {doctors.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedDoctorIds.includes(d.id)}
                    onChange={() => toggleDoctor(d.id)}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || doctors.length === 0}
          className="self-start rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Generando..." : "Generar plan semanal"}
        </button>
      </form>

      {result && <PlannerResults result={result} />}
    </div>
  );
}

function PlannerResults({ result }: { result: PlannerResult }) {
  const dayLabel = (dayOfWeek: number) =>
    DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label ?? String(dayOfWeek);

  return (
    <div className="flex flex-col gap-4">
      {result.unscheduled.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h3 className="font-medium text-amber-900">Sin agendar</h3>
          <ul className="text-sm text-amber-900 mt-1 list-disc list-inside">
            {result.unscheduled.map((u) => (
              <li key={u.doctorId}>
                {u.doctorName}: {u.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.days.map((day) => (
        <div key={day.dayOfWeek} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-medium">
              {dayLabel(day.dayOfWeek)} · {day.date}
            </h3>
            {day.stops.length > 0 && (
              <p className="text-xs text-slate-500">
                Traslado total: {day.totalTravelMinutes} min · Visitas: {day.totalVisitMinutes} min ·
                Regreso: {day.returnHomeTime}
              </p>
            )}
          </div>

          {day.stops.length === 0 ? (
            <p className="text-sm text-slate-500 mt-2">Sin visitas este día.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {day.stops.map((stop, idx) => (
                <li key={stop.doctorId} className="text-sm border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {idx + 1}. {stop.doctorName}
                    </span>
                    <span className="text-slate-600">
                      {stop.arrival} - {stop.departure}
                    </span>
                  </div>
                  <p className="text-slate-500">{stop.address}</p>
                  <p className="text-xs text-slate-500">
                    Traslado: {stop.travelMinutes} min · Visita estimada: {stop.visitMinutes} min
                    {stop.usedDefaultDuration ? " (sin historial, usando valor por defecto)" : ""}
                  </p>
                  {stop.warning && (
                    <p className="text-xs text-amber-700 mt-1">⚠ {stop.warning}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}
