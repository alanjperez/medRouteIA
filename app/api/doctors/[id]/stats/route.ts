import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/doctors/[id]/stats">) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const doctorId = Number(id);

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.userId !== sessionUser.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const aggregate = await prisma.visit.aggregate({
    where: { doctorId },
    _avg: { durationMin: true },
    _min: { durationMin: true },
    _max: { durationMin: true },
    _count: { _all: true },
  });

  return NextResponse.json({
    doctorId,
    visitCount: aggregate._count._all,
    avgDurationMin: aggregate._avg.durationMin,
    minDurationMin: aggregate._min.durationMin,
    maxDurationMin: aggregate._max.durationMin,
  });
}
