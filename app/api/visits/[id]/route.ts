import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/visits/[id]">) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const visit = await prisma.visit.findUnique({
    where: { id: Number(id) },
    include: { doctor: true },
  });
  if (!visit || visit.doctor.userId !== sessionUser.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.visit.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
