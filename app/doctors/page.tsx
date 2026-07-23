import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayNameEs } from "@/lib/time";
import { requireUser } from "@/lib/auth";
import DoctorForm from "@/components/DoctorForm";

export const dynamic = "force-dynamic";

export default async function DoctorsPage() {
  const user = await requireUser();

  const doctors = await prisma.doctor.findMany({
    where: { userId: user.id, active: true },
    include: { officeHours: { orderBy: { dayOfWeek: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Médicos</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/doctors/importar"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Importar desde Excel
          </Link>
          <DoctorForm />
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">Todavía no has agregado ningún médico.</p>
          <p className="text-sm text-slate-500 mt-1">
            Agrega uno manualmente o importa tu panel completo desde un archivo Excel.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              href={`/doctors/${doctor.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{doctor.name}</h2>
                {doctor.specialty && (
                  <span className="text-xs text-slate-500">{doctor.specialty}</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">{doctor.address}</p>
              <p className="text-xs text-slate-500 mt-1">
                {doctor.municipality}, {doctor.department}
                {doctor.zone ? ` (Zona ${doctor.zone})` : ""}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {doctor.officeHours.map((oh) => dayNameEs(oh.dayOfWeek)).join(", ")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Capacidad diaria: {doctor.dailyCapacity} visitador
                {doctor.dailyCapacity === 1 ? "" : "es"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
