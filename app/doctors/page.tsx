import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayNameEs } from "@/lib/time";
import DoctorForm from "@/components/DoctorForm";

export const dynamic = "force-dynamic";

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    where: { active: true },
    include: { officeHours: { orderBy: { dayOfWeek: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Médicos</h1>
        <DoctorForm />
      </div>

      {doctors.length === 0 ? (
        <p className="text-slate-600">Todavía no has agregado ningún médico.</p>
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
