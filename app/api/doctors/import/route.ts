import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parseDoctorsWorkbook } from "@/lib/doctor-import";

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Adjunta un archivo Excel (.xlsx)" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const { rows, errors } = parseDoctorsWorkbook(buffer);

  let created = 0;
  for (const row of rows) {
    try {
      await prisma.doctor.create({
        data: {
          userId: sessionUser.id,
          name: row.name,
          specialty: row.specialty,
          address: row.address,
          department: row.department,
          municipality: row.municipality,
          zone: row.zone ?? null,
          phone: row.phone,
          dailyCapacity: row.dailyCapacity,
          officeHours: { create: row.officeHours },
        },
      });
      created += 1;
    } catch {
      errors.push({ row: 0, message: `No se pudo guardar "${row.name}"` });
    }
  }

  return NextResponse.json({ created, errors });
}
