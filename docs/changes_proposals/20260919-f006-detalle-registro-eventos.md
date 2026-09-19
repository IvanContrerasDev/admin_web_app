# F-006 — Detalle de registro y metadata de eventos

**Fecha:** 2026-09-19
**Estado:** aprobado por el humano para implementación mock-first; materialización backend pendiente.
**Alcance:** lectura bajo demanda desde la matriz mensual. No agrega ni modifica operaciones de escritura.

## Decisión aprobada

Al abrir una celda con registro, el admin consulta `GET /records/{id}`. La respuesta contiene toda la información visible del registro, sus relaciones y sus intervalos. Cada intervalo automático incluye referencias livianas a sus `AttendanceEvent`; no incluye su metadata completa para evitar cargarla en la matriz o al abrir el modal.

El botón **Más detalles** dispara, bajo demanda y en paralelo, una consulta `GET /attendance-events/{id}` por cada referencia de evento. Los intervalos manuales no sintetizan eventos y se muestran como “sin eventos automáticos asociados”. La metadata es inmutable y de solo lectura.

## DTO candidato implementado en mocks

```ts
interface RecordDetail {
  id: string;
  date: string;
  employee: { id: string; firstName: string; lastName: string; employeeId: string };
  workplace: { id: string; name: string };
  client: { id: string; name: string };
  site: { id: string; name: string };
  totalWorkMinutes: number;
  recordStatus: "COMPLETE" | "INCOMPLETE";
  reviewStatus: "NONE" | "PENDING" | "APPROVED" | "MANUAL_LOADED";
  origin: "AUTOMATIC" | "MANUAL";
  hasAbsence: boolean;
  observations: string | null;
  version: number;
  intervals: RecordInterval[];
  createdAt: string;
  updatedAt: string;
}

interface RecordInterval {
  id: string;
  type: "WORK" | "ABSENCE";
  status: "OPEN" | "SEMI_CLOSED" | "CLOSED";
  startTime: string | null;
  endTime: string | null;
  absenceReason: "ILLNESS" | "VACATION" | "LEAVE" | "ART" | "OTHER" | null;
  observations: string | null;
  origin: "AUTOMATIC" | "MANUAL";
  reviewStatus: RecordDetail["reviewStatus"];
  attendanceEvents: Array<{
    id: string;
    type: "CHECK_IN" | "CHECK_OUT" | "ABSENCE";
    occurredAt: string;
  }>;
}

interface AttendanceEventDetail {
  id: string;
  recordId: string;
  intervalId: string;
  type: "CHECK_IN" | "CHECK_OUT" | "ABSENCE";
  occurredAt: string;
  receivedAt: string;
  origin: "MOBILE" | "ADMIN";
  observation: string | null;
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
  } | null;
  metadata: Record<string, string | number | boolean | null>;
}
```

Todos los endpoints responden con `{ data: ... }`. UUID, fechas y timestamps se validan en la capa de servicio. La UI muestra fechas y horarios en `America/Argentina/Buenos_Aires`, distingue `null` de valores conocidos y renderiza todas las entradas escalares de `metadata` sin depender de claves específicas.

## UX y accesibilidad

- Doble clic sobre una celda con registro abre el modal.
- `Enter` o barra espaciadora sobre la celda enfocada ofrecen la alternativa de teclado.
- `recordId` se conserva en query string para permitir navegación y enlace directo.
- El diálogo tiene título, descripción, cierre visible y cierre con `Escape`.
- Estados de carga, error y reintento se resuelven por detalle y por evento.

## Pendiente de backend

Materializar ambos endpoints, confirmar nombres finales de metadata y publicar ejemplos de eventos con/sin ubicación, offline, ausencia y datos históricos incompletos. Si el backend modifica estos DTOs debe coordinar el cambio contractual antes de reemplazar los mocks.
