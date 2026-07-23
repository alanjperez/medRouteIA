import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GUATEMALA_DEPARTMENTS, GUATEMALA_CITY_ZONES, isCapitalCity } from "@/lib/guatemala-locations";
import { hashPassword, createSession, getSessionUser } from "@/lib/auth";

const USER_SAFE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  pharmaLab: true,
  department: true,
  municipality: true,
  zone: true,
  createdAt: true,
} as const;

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: USER_SAFE_SELECT,
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, password, phone, pharmaLab, department, municipality, zone } =
    body as {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone: string;
      pharmaLab: string;
      department: string;
      municipality: string;
      zone?: number;
    };

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !phone ||
    !pharmaLab ||
    !department ||
    !municipality
  ) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
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
      passwordHash: hashPassword(password),
      phone,
      pharmaLab,
      department,
      municipality,
      zone: isCapital ? zone : null,
    },
  });

  await createSession(user.id);

  return NextResponse.json(
    { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
    { status: 201 }
  );
}
