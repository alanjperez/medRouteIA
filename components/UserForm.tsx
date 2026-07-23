"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GUATEMALA_DEPARTMENTS, GUATEMALA_CITY_ZONES, isCapitalCity } from "@/lib/guatemala-locations";

const DEPARTMENTS = Object.keys(GUATEMALA_DEPARTMENTS).sort((a, b) => a.localeCompare(b, "es"));

export default function UserForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pharmaLab, setPharmaLab] = useState("");
  const [department, setDepartment] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [zone, setZone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const municipalities = useMemo(
    () => (department ? [...GUATEMALA_DEPARTMENTS[department]].sort((a, b) => a.localeCompare(b, "es")) : []),
    [department]
  );
  const needsZone = isCapitalCity(department, municipality);

  function handleDepartmentChange(value: string) {
    setDepartment(value);
    setMunicipality("");
    setZone("");
  }

  function handleMunicipalityChange(value: string) {
    setMunicipality(value);
    setZone("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!firstName || !lastName || !email || !phone || !pharmaLab || !department || !municipality) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (needsZone && !zone) {
      setError("Selecciona la zona de la Ciudad de Guatemala.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          pharmaLab,
          department,
          municipality,
          zone: needsZone ? Number(zone) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear el usuario");
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPharmaLab("");
      setDepartment("");
      setMunicipality("");
      setZone("");
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
      className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-4 max-w-xl"
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Usuario creado correctamente.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Nombre *
          <input
            className="border rounded px-2 py-1"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Apellido *
          <input
            className="border rounded px-2 py-1"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email *
          <input
            type="email"
            className="border rounded px-2 py-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Número de teléfono *
          <input
            className="border rounded px-2 py-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Laboratorio farmacéutico *
          <input
            className="border rounded px-2 py-1"
            value={pharmaLab}
            onChange={(e) => setPharmaLab(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Sector *</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Departamento
            <select
              className="border rounded px-2 py-1"
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              required
            >
              <option value="">Selecciona...</option>
              {DEPARTMENTS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Municipio
            <select
              className="border rounded px-2 py-1 disabled:bg-slate-100"
              value={municipality}
              onChange={(e) => handleMunicipalityChange(e.target.value)}
              disabled={!department}
              required
            >
              <option value="">Selecciona...</option>
              {municipalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          {needsZone && (
            <label className="flex flex-col gap-1 text-sm">
              Zona (Ciudad de Guatemala)
              <select
                className="border rounded px-2 py-1"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                required
              >
                <option value="">Selecciona...</option>
                {GUATEMALA_CITY_ZONES.map((z) => (
                  <option key={z} value={z}>
                    Zona {z}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : "Crear usuario"}
      </button>
    </form>
  );
}
