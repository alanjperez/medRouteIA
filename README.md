# Planificador semanal de visitas médicas

Aplicación para planificar y agendar visitas a médicos, pensada para
visitadores médicos. Registra el nombre, dirección, horarios y días de
atención de cada consultorio, junto con su capacidad diaria de
visitadores, y anota cuánto tardas en cada visita para calcular tu
tiempo promedio por médico.

El planificador semanal automatiza la agenda: agrupa los médicos por
día según cercanía geográfica y disponibilidad, ordena las visitas de
cada día para minimizar los traslados, y usa el tiempo promedio
histórico (o un valor por defecto si aún no hay historial) para
estimar horarios de llegada y salida, marcando advertencias cuando una
visita cae fuera del horario de atención.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM 7 + SQLite (`@prisma/adapter-better-sqlite3`)

## Desarrollo

```bash
npm install
npx prisma migrate deploy   # crea/actualiza dev.db
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `prisma/schema.prisma` — modelos `Doctor`, `OfficeHour` (días/horarios
  de atención) y `Visit` (historial de visitas).
- `lib/planner.ts` — algoritmo de optimización semanal (asignación de
  médicos por día + ruta por cercanía con `lib/geo.ts`).
- `app/api/*` — endpoints REST para médicos, visitas y generación del
  plan semanal.
- `app/doctors`, `app/visits/new`, `app/planner` — páginas de la app.

## Notas

- La distancia y el tiempo de traslado se estiman con la fórmula de
  Haversine entre coordenadas (no hay integración con un servicio de
  mapas), así que cada médico y tu punto de partida se ingresan como
  latitud/longitud manual (por ejemplo, copiadas desde Google Maps).
- La "capacidad diaria" de un médico es el número de visitadores que
  su consultorio atiende por día; se usa como referencia y para
  priorizar el orden de asignación en el planificador.
