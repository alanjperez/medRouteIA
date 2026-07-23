import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GUATEMALA_DEPARTMENTS, GUATEMALA_CITY_ZONES, isCapitalCity } from "@/lib/guatemala-locations";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, phone, pharmaLab, department, municipality, zone } = body as {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    pharmaLab: string;
    department: string;
    municipality: string;
    zone?: number;
  };

  if (!firstName || !lastName || !email || !phone || !pharmaLab || !department || !municipality) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }

  const municipalities = GUATEMALA_DEPARTMENTS[department];
  if (!municipalities || !municipalities.includes(municipality)) {
    return NextResponse.json({ error: "Departamento o municipio inválido" }, { status: 400 });
  }

  const isCapital = isCapitalCity(department, municipality);
  if (isCapital && (zone === undefined || !GUATEMALA_CITY_ZONES.includes(zone))) {
    return NextResponse.json(
      { error: "Selecciona una zona válida de la Ciudad de Guatemala" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      pharmaLab,
      department,
      municipality,
      zone: isCapital ? zone : null,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
