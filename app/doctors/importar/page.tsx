import { requireUser } from "@/lib/auth";
import ImportDoctorsForm from "@/components/ImportDoctorsForm";

export const dynamic = "force-dynamic";

export default async function ImportDoctorsPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar panel médico</h1>
        <p className="text-slate-600 max-w-2xl mt-1">
          Carga tu panel médico completo desde un archivo Excel en vez de agregar cada
          médico manualmente.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 max-w-xl">
        <h2 className="font-medium mb-2">Formato del archivo</h2>
        <p className="text-sm text-slate-600 mb-3">
          La primera fila debe ser el encabezado con estas columnas:
        </p>
        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
          <li>Nombre *</li>
          <li>Especialidad</li>
          <li>Dirección *</li>
          <li>Departamento * (uno de los 22 departamentos de Guatemala)</li>
          <li>Municipio * (según el departamento)</li>
          <li>Zona (obligatorio solo si Departamento y Municipio son &quot;Guatemala&quot;)</li>
          <li>Teléfono</li>
          <li>Capacidad diaria (número, por defecto 1)</li>
          <li>Días de atención * (ej. &quot;Lunes,Miércoles,Viernes&quot;)</li>
          <li>Hora apertura * (ej. 08:00)</li>
          <li>Hora cierre * (ej. 17:00)</li>
        </ul>
        <a
          href="/plantilla-panel-medico.xlsx"
          download
          className="inline-block mt-4 text-sm text-slate-900 underline"
        >
          Descargar plantilla de ejemplo (.xlsx)
        </a>
      </div>

      <ImportDoctorsForm />
    </div>
  );
}
