"use client";

import { useMemo } from "react";
import { GUATEMALA_DEPARTMENTS, GUATEMALA_CITY_ZONES, isCapitalCity } from "@/lib/guatemala-locations";

const DEPARTMENTS = Object.keys(GUATEMALA_DEPARTMENTS).sort((a, b) => a.localeCompare(b, "es"));

export type SectorValue = { department: string; municipality: string; zone: string };

export const EMPTY_SECTOR: SectorValue = { department: "", municipality: "", zone: "" };

export function sectorNeedsZone(value: SectorValue): boolean {
  return isCapitalCity(value.department, value.municipality);
}

// Cascading Departamento -> Municipio -> Zona (only for the Ciudad de
// Guatemala municipality) selects, backed by the verified Guatemala catalog.
export default function SectorFields({
  value,
  onChange,
  legend = "Sector",
}: {
  value: SectorValue;
  onChange: (next: SectorValue) => void;
  legend?: string;
}) {
  const municipalities = useMemo(
    () =>
      value.department
        ? [...GUATEMALA_DEPARTMENTS[value.department]].sort((a, b) => a.localeCompare(b, "es"))
        : [],
    [value.department]
  );
  const needsZone = sectorNeedsZone(value);

  return (
    <div>
      {legend && <h3 className="text-sm font-medium mb-2">{legend} *</h3>}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Departamento
          <select
            className="border rounded px-2 py-1"
            value={value.department}
            onChange={(e) => onChange({ department: e.target.value, municipality: "", zone: "" })}
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
            value={value.municipality}
            onChange={(e) => onChange({ ...value, municipality: e.target.value, zone: "" })}
            disabled={!value.department}
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
              value={value.zone}
              onChange={(e) => onChange({ ...value, zone: e.target.value })}
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
  );
}
