# Planificador semanal de visitas médicas

Aplicación multiusuario para planificar y agendar visitas a médicos,
pensada para visitadores médicos. Cada usuario crea una cuenta, registra
su propio panel de médicos (manualmente o importado desde Excel) con
dirección, sector y horarios de atención, y anota cuánto tarda en cada
visita para calcular su tiempo promedio por médico.

El planificador semanal automatiza la agenda: agrupa los médicos por
día según cercanía geográfica (departamento/municipio/zona) y
disponibilidad, ordena las visitas de cada día para minimizar los
traslados, y usa el tiempo promedio histórico (o un valor por defecto
si aún no hay historial) para estimar horarios de llegada y salida,
marcando advertencias cuando una visita cae fuera del horario de
atención.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM 7 + SQLite (`@prisma/adapter-better-sqlite3`)
- Autenticación propia por sesión (cookie httpOnly + `scrypt`, sin
  proveedores externos)
- `xlsx` (SheetJS) para importar el panel médico desde Excel

## Desarrollo

```bash
npm install
npx prisma migrate deploy   # crea/actualiza dev.db
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — te pedirá crear
una cuenta o iniciar sesión antes de ver la app.

## Estructura

- `prisma/schema.prisma` — modelos `User` (cuenta + sector asignado),
  `Session`, `Doctor` (con `userId`), `OfficeHour` y `Visit`.
- `lib/auth.ts` — hash/verificación de contraseña, sesiones, `requireUser()`.
- `lib/guatemala-locations.ts` — catálogo de los 22 departamentos y sus
  municipios, y las 22 zonas de la Ciudad de Guatemala.
- `lib/geo.ts` + `lib/planner.ts` — estimación de traslado entre
  sectores y algoritmo de optimización semanal.
- `lib/doctor-import.ts` — parseo y validación del Excel de importación.
- `app/api/*` — endpoints REST (auth, usuarios, médicos, visitas, plan,
  importación), todos filtrados por el usuario en sesión.
- `app/login`, `app/usuarios/nuevo`, `app/doctors`, `app/doctors/importar`,
  `app/visits/new`, `app/planner` — páginas de la app.

## Notas

- No hay integración con un servicio de mapas: la cercanía entre
  médicos se estima por sector (mismo zona/municipio/departamento),
  no por coordenadas. Cada médico y tu punto de partida se capturan
  como Departamento → Municipio → Zona (esta última solo aplica a la
  Ciudad de Guatemala).
- La "capacidad diaria" de un médico es el número de visitadores que
  su consultorio atiende por día; se usa como referencia y para
  priorizar el orden de asignación en el planificador.
- Los datos de médicos y visitas están aislados por usuario: cada
  cuenta solo ve y planifica su propio panel.
- La plantilla de importación está en `public/plantilla-panel-medico.xlsx`.
