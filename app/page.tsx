import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [doctorCount, visitCount, avgAgg] = await Promise.all([
    prisma.doctor.count({ where: { active: true } }),
    prisma.visit.count(),
    prisma.visit.aggregate({ _avg: { durationMin: true } }),
  ]);

  const cards = [
    {
      href: "/doctors",
      title: "Médicos",
      description: "Administra nombre, dirección, horarios y días de atención de cada consultorio.",
      stat: `${doctorCount} médico${doctorCount === 1 ? "" : "s"}`,
    },
    {
      href: "/visits/new",
      title: "Registrar visita",
      description: "Anota cuánto tardaste en cada visita para calcular tu tiempo promedio por médico.",
      stat: `${visitCount} visita${visitCount === 1 ? "" : "s"} registrada${visitCount === 1 ? "" : "s"}`,
    },
    {
      href: "/planner",
      title: "Planificador semanal",
      description: "Genera automáticamente tu itinerario de la semana optimizando traslados y esperas.",
      stat: avgAgg._avg.durationMin
        ? `${Math.round(avgAgg._avg.durationMin)} min promedio/visita`
        : "Sin datos históricos aún",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Planificador semanal de visitas médicas</h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Registra tus médicos, sus horarios y días de atención, y deja que el planificador
          optimice el orden y horario de tus visitas cada semana, minimizando tiempos de
          movilización y espera.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors"
          >
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{card.description}</p>
            <p className="mt-3 text-sm font-semibold text-slate-800">{card.stat}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
