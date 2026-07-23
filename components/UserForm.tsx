"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SectorFields, { EMPTY_SECTOR, sectorNeedsZone, type SectorValue } from "@/components/SectorFields";

export default function UserForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [pharmaLab, setPharmaLab] = useState("");
  const [sector, setSector] = useState<SectorValue>(EMPTY_SECTOR);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phone ||
      !pharmaLab ||
      !sector.department ||
      !sector.municipality
    ) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (sectorNeedsZone(sector) && !sector.zone) {
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
          password,
          phone,
          pharmaLab,
          department: sector.department,
          municipality: sector.municipality,
          zone: sector.zone ? Number(sector.zone) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear el usuario");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
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
        <label className="flex flex-col gap-1 text-sm">
          Contraseña *
          <input
            type="password"
            className="border rounded px-2 py-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirmar contraseña *
          <input
            type="password"
            className="border rounded px-2 py-1"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
      </div>

      <SectorFields value={sector} onChange={setSector} />

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
