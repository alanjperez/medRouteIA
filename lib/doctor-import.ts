import * as XLSX from "xlsx";
import { GUATEMALA_DEPARTMENTS, GUATEMALA_CITY_ZONES, isCapitalCity } from "@/lib/guatemala-locations";
import { DAYS_OF_WEEK } from "@/lib/constants";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

const DEPARTMENT_LOOKUP = new Map(
  Object.keys(GUATEMALA_DEPARTMENTS).map((d) => [normalize(d), d])
);

const MUNICIPALITY_LOOKUP = new Map<string, string>();
for (const [dept, municipalities] of Object.entries(GUATEMALA_DEPARTMENTS)) {
  for (const m of municipalities) {
    MUNICIPALITY_LOOKUP.set(`${normalize(dept)}|${normalize(m)}`, m);
  }
}

const DAY_LOOKUP = new Map(DAYS_OF_WEEK.map((d) => [normalize(d.label), d.value]));

export type ImportedDoctorRow = {
  name: string;
  specialty?: string;
  address: string;
  department: string;
  municipality: string;
  zone?: number;
  phone?: string;
  dailyCapacity: number;
  officeHours: { dayOfWeek: number; openTime: string; closeTime: string }[];
};

export type ImportRowError = { row: number; message: string };

export type ImportParseResult = {
  rows: ImportedDoctorRow[];
  errors: ImportRowError[];
};

// Column headers we recognize, per field (matched accent/case-insensitively).
const COLUMN_ALIASES: Record<string, string[]> = {
  name: ["Nombre", "Nombre del médico", "Médico", "Medico"],
  specialty: ["Especialidad"],
  address: ["Dirección", "Direccion"],
  department: ["Departamento"],
  municipality: ["Municipio"],
  zone: ["Zona"],
  phone: ["Teléfono", "Telefono"],
  dailyCapacity: ["Capacidad diaria", "Capacidad"],
  days: ["Días de atención", "Dias de atencion", "Días", "Dias"],
  openTime: ["Hora apertura", "Apertura"],
  closeTime: ["Hora cierre", "Cierre"],
};

function parseTimeValue(value: unknown): string | null {
  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  return null;
}

export function parseDoctorsWorkbook(buffer: ArrayBuffer): ImportParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const rows: ImportedDoctorRow[] = [];
  const errors: ImportRowError[] = [];

  function cell(record: Record<string, unknown>, field: keyof typeof COLUMN_ALIASES): unknown {
    const aliases = COLUMN_ALIASES[field];
    for (const key of Object.keys(record)) {
      if (aliases.some((alias) => normalize(alias) === normalize(key))) {
        return record[key];
      }
    }
    return "";
  }

  function text(record: Record<string, unknown>, field: keyof typeof COLUMN_ALIASES): string {
    return String(cell(record, field) ?? "").trim();
  }

  raw.forEach((record, idx) => {
    const rowNum = idx + 2; // header occupies row 1

    const name = text(record, "name");
    const specialty = text(record, "specialty");
    const address = text(record, "address");
    const departmentRaw = text(record, "department");
    const municipalityRaw = text(record, "municipality");
    const zoneRaw = text(record, "zone");
    const phone = text(record, "phone");
    const capacityRaw = text(record, "dailyCapacity");
    const daysRaw = text(record, "days");
    const openRaw = cell(record, "openTime");
    const closeRaw = cell(record, "closeTime");

    if (!name || !address || !departmentRaw || !municipalityRaw || !daysRaw || !openRaw || !closeRaw) {
      errors.push({
        row: rowNum,
        message:
          "Faltan columnas obligatorias (Nombre, Dirección, Departamento, Municipio, Días de atención, Hora apertura, Hora cierre)",
      });
      return;
    }

    const department = DEPARTMENT_LOOKUP.get(normalize(departmentRaw));
    if (!department) {
      errors.push({ row: rowNum, message: `Departamento "${departmentRaw}" no reconocido` });
      return;
    }

    const municipality = MUNICIPALITY_LOOKUP.get(`${normalize(department)}|${normalize(municipalityRaw)}`);
    if (!municipality) {
      errors.push({ row: rowNum, message: `Municipio "${municipalityRaw}" no pertenece a ${department}` });
      return;
    }

    let zone: number | undefined;
    if (isCapitalCity(department, municipality)) {
      zone = Number(zoneRaw);
      if (!zoneRaw || Number.isNaN(zone) || !GUATEMALA_CITY_ZONES.includes(zone)) {
        errors.push({ row: rowNum, message: `Zona "${zoneRaw}" inválida para la Ciudad de Guatemala` });
        return;
      }
    }

    const dayTokens = daysRaw
      .split(/[,;/]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const dayOfWeeks: number[] = [];
    let dayError = false;
    for (const token of dayTokens) {
      const dayValue = DAY_LOOKUP.get(normalize(token));
      if (dayValue === undefined) {
        errors.push({ row: rowNum, message: `Día "${token}" no reconocido` });
        dayError = true;
        break;
      }
      dayOfWeeks.push(dayValue);
    }
    if (dayError) return;

    const openTime = parseTimeValue(openRaw);
    const closeTime = parseTimeValue(closeRaw);
    if (!openTime || !closeTime) {
      errors.push({ row: rowNum, message: "Hora de apertura o cierre inválida (formato esperado HH:MM)" });
      return;
    }

    const dailyCapacity = capacityRaw ? Number(capacityRaw) || 1 : 1;

    rows.push({
      name,
      specialty: specialty || undefined,
      address,
      department,
      municipality,
      zone,
      phone: phone || undefined,
      dailyCapacity,
      officeHours: dayOfWeeks.map((dayOfWeek) => ({ dayOfWeek, openTime, closeTime })),
    });
  });

  return { rows, errors };
}
