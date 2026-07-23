import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();

  const doctors = await prisma.doctor.findMany({
    where: { userId: user.id, active: true },
    include: { visits: { select: { date: true, durationMin: true } } },
    orderBy: { name: "asc" },
  });

  const visitCount = doctors.reduce((s, d) => s + d.visits.length, 0);
  const totalDuration = doctors.reduce(
    (s, d) => s + d.visits.reduce((s2, v) => s2 + v.durationMin, 0),
    0
  );
  const avgDuration = visitCount ? Math.round(totalDuration / visitCount) : null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const visitsThisWeek = doctors.reduce(
    (s, d) => s + d.visits.filter((v) => v.date >= weekAgo).length,
    0
  );

  const doctorsNeedingVisit = doctors
    .map((d) => {
      const lastVisit = d.visits.length
        ? d.visits.reduce((latest, v) => (v.date > latest ? v.date : latest), d.visits[0].date)
        : null;
      return { id: d.id, name: d.name, lastVisit };
    })
    .sort((a, b) => {
      if (!a.lastVisit && !b.lastVisit) return 0;
      if (!a.lastVisit) return -1;
      if (!b.lastVisit) return 1;
      return a.lastVisit.getTime() - b.lastVisit.getTime();
    })
    .slice(0, 5);

  const doctorAverages = doctors
    .filter((d) => d.visits.length > 0)
    .map((d) => ({
      name: d.name,
      avg: Math.round(d.visits.reduce((s, v) => s + v.durationMin, 0) / d.visits.length),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6);
  const maxAvg = Math.max(1, ...doctorAverages.map((d) => d.avg));

  const cards = [
    { label: "Médicos activos", value: doctors.length },
    { label: "Visitas esta semana", value: visitsThisWeek },
    {
      label: "Promedio por visita",
      value: avgDuration !== null ? `${avgDuration} min` : "Sin datos",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {user.firstName}</h1>
          <p className="mt-1 text-slate-600 max-w-2xl">
            Este es tu panel: revisa tu actividad reciente y genera tu itinerario de la
            semana cuando quieras.
          </p>
        </div>
        <Link
          href="/planner"
          className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
        >
          Generar plan de la semana
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-medium mb-1">Médicos que necesitan una visita</h2>
          <p className="text-xs text-slate-500 mb-3">Ordenados por visita más antigua (o sin visitas).</p>
          {doctors.length === 0 ? (
            <p className="text-sm text-slate-600">
              Aún no tienes médicos.{" "}
              <Link href="/doctors" className="underline">
                Agrega el primero
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {doctorsNeedingVisit.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/doctors/${d.id}`} className="text-slate-800 hover:underline">
                    {d.name}
                  </Link>
                  <span className="text-slate-500">
                    {d.lastVisit ? `Última visita: ${d.lastVisit.toISOString().slice(0, 10)}` : "Sin visitas"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-medium mb-1">Tiempo promedio por médico</h2>
          <p className="text-xs text-slate-500 mb-3">Médicos con más tiempo de visita registrado.</p>
          {doctorAverages.length === 0 ? (
            <p className="text-sm text-slate-600">
              Registra tu primera visita para ver este comparativo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {doctorAverages.map((d) => (
                <li key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-slate-700">{d.name}</span>
                  <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(6, (d.avg / maxAvg) * 100)}%`,
                        backgroundColor: "#2a78d6",
                      }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right text-slate-600">{d.avg} min</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/visits/new"
          className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors"
        >
          <h2 className="font-medium">Registrar visita</h2>
          <p className="mt-1 text-sm text-slate-600">
            Anota cuánto tardaste en cada visita para calcular tu tiempo promedio por médico.
          </p>
        </Link>
        <Link
          href="/doctors/importar"
          className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors"
        >
          <h2 className="font-medium">Importar panel médico</h2>
          <p className="mt-1 text-sm text-slate-600">
            Carga tu lista de médicos desde un archivo Excel en lugar de agregarlos uno por uno.
          </p>
        </Link>
      </div>
    </div>
  );
}
