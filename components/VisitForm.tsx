"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DoctorOption = { id: number; name: string };

export default function VisitForm({
  doctors,
  fixedDoctorId,
}: {
  doctors: DoctorOption[];
  fixedDoctorId?: number;
}) {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string>(
    fixedDoctorId ? String(fixedDoctorId) : doctors[0] ? String(doctors[0].id) : ""
  );
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!doctorId || !date || !arrivalTime || !departureTime) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: Number(doctorId),
          date,
          arrivalTime,
          departureTime,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo registrar la visita");
      }
      setArrivalTime("");
      setDepartureTime("");
      setNotes("");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-4 max-w-md"
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Visita registrada.
        </p>
      )}

      {!fixedDoctorId && (
        <label className="flex flex-col gap-1 text-sm">
          Médico *
          <select
            className="border rounded px-2 py-1"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            required
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Fecha *
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 text-sm flex-1">
          Hora de llegada *
          <input
            type="time"
            className="border rounded px-2 py-1"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm flex-1">
          Hora de salida *
          <input
            type="time"
            className="border rounded px-2 py-1"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notas
        <textarea
          className="border rounded px-2 py-1"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={submitting || doctors.length === 0}
        className="self-start rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : "Registrar visita"}
      </button>
    </form>
  );
}
