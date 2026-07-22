import Link from "next/link";
import { prisma } from "@/lib/db";
import VisitForm from "@/components/VisitForm";

export const dynamic = "force-dynamic";

export default async function NewVisitPage() {
  const doctors = await prisma.doctor.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar visita</h1>
      <p className="text-slate-600 max-w-xl">
        Anota la hora de llegada y salida de cada visita. Con estos datos el planificador
        calculará cuánto tiempo sueles tardar en cada médico.
      </p>

      {doctors.length === 0 ? (
        <p className="text-slate-600">
          Primero agrega un médico en{" "}
          <Link href="/doctors" className="underline">
            la sección Médicos
          </Link>
          .
        </p>
      ) : (
        <VisitForm doctors={doctors} />
      )}
    </div>
  );
}
