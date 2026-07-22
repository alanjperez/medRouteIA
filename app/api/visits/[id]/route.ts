import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/visits/[id]">) {
  const { id } = await ctx.params;
  await prisma.visit.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
