import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { dayNameEs } from "@/lib/time";
import { requireUser } from "@/lib/auth";
import VisitForm from "@/components/VisitForm";
import DeleteDoctorButton from "@/components/DeleteDoctorButton";

export const dynamic = "force-dynamic";

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const doctorId = Number(id);

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      officeHours: { orderBy: { dayOfWeek: "asc" } },
      visits: { orderBy: { date: "desc" } },
    },
  });

  if (!doctor || doctor.userId !== user.id) notFound();

  const aggregate = await prisma.visit.aggregate({
    where: { doctorId },
    _avg: { durationMin: true },
    _min: { durationMin: true },
    _max: { durationMin: true },
    _count: { _all: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{doctor.name}</h1>
          {doctor.specialty && <p className="text-slate-600">{doctor.specialty}</p>}
          <p className="text-slate-600 mt-1">{doctor.address}</p>
          <p className="text-slate-600">
            {doctor.municipality}, {doctor.department}
            {doctor.zone ? ` (Zona ${doctor.zone})` : ""}
          </p>
          {doctor.phone && <p className="text-slate-600">{doctor.phone}</p>}
        </div>
        <DeleteDoctorButton doctorId={doctor.id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium mb-2">Días y horario de atención</h2>
          <ul className="text-sm text-slate-700 flex flex-col gap-1">
            {doctor.officeHours.map((oh) => (
              <li key={oh.id}>
                {dayNameEs(oh.dayOfWeek)}: {oh.openTime} - {oh.closeTime}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-600 mt-3">
            Capacidad diaria: {doctor.dailyCapacity} visitador{doctor.dailyCapacity === 1 ? "" : "es"}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium mb-2">Tiempo promedio por visita</h2>
          {aggregate._count._all === 0 ? (
            <p className="text-sm text-slate-600">
              Aún no hay visitas registradas para calcular un promedio.
            </p>
          ) : (
            <ul className="text-sm text-slate-700 flex flex-col gap-1">
              <li>Visitas registradas: {aggregate._count._all}</li>
              <li>Promedio: {Math.round(aggregate._avg.durationMin ?? 0)} min</li>
              <li>Mínimo: {aggregate._min.durationMin} min</li>
              <li>Máximo: {aggregate._max.durationMin} min</li>
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-medium mb-2">Registrar nueva visita</h2>
        <VisitForm doctors={[{ id: doctor.id, name: doctor.name }]} fixedDoctorId={doctor.id} />
      </div>

      <div>
        <h2 className="font-medium mb-2">Historial de visitas</h2>
        {doctor.visits.length === 0 ? (
          <p className="text-sm text-slate-600">Sin visitas registradas todavía.</p>
        ) : (
          <table className="w-full text-sm bg-white border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Llegada</th>
                <th className="px-3 py-2">Salida</th>
                <th className="px-3 py-2">Duración</th>
                <th className="px-3 py-2">Notas</th>
              </tr>
            </thead>
            <tbody>
              {doctor.visits.map((visit) => (
                <tr key={visit.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{visit.date.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">{visit.arrivalTime}</td>
                  <td className="px-3 py-2">{visit.departureTime}</td>
                  <td className="px-3 py-2">{visit.durationMin} min</td>
                  <td className="px-3 py-2">{visit.notes ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
