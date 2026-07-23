"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  created: number;
  errors: { row: number; message: string }[];
};

export default function ImportDoctorsForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona un archivo Excel (.xlsx).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setSubmitting(true);
    try {
      const res = await fetch("/api/doctors/import", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo importar el archivo");
      }
      setResult(data);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-4 max-w-xl"
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Archivo Excel (.xlsx)
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="border rounded px-2 py-1" />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Importando..." : "Importar médicos"}
        </button>
      </form>

      {result && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 max-w-xl flex flex-col gap-3">
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {result.created} médico{result.created === 1 ? "" : "s"} importado
            {result.created === 1 ? "" : "s"} correctamente.
          </p>
          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-amber-800">
                {result.errors.length} fila{result.errors.length === 1 ? "" : "s"} con problemas:
              </p>
              <ul className="text-sm text-amber-800 mt-1 list-disc list-inside">
                {result.errors.map((e, idx) => (
                  <li key={idx}>
                    {e.row > 0 ? `Fila ${e.row}: ` : ""}
                    {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
