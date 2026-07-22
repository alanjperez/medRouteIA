import { prisma } from "@/lib/db";
import PlannerForm from "@/components/PlannerForm";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const doctors = await prisma.doctor.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Planificador semanal</h1>
        <p className="text-slate-600 max-w-2xl mt-1">
          Genera un itinerario optimizado para la semana: agrupa médicos por día según
          cercanía y disponibilidad, ordena las visitas para minimizar traslados, y usa tu
          tiempo promedio histórico por médico para estimar horarios de llegada y salida.
        </p>
      </div>
      <PlannerForm doctors={doctors} />
    </div>
  );
}
