import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/doctors/[id]/stats">) {
  const { id } = await ctx.params;
  const doctorId = Number(id);

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
