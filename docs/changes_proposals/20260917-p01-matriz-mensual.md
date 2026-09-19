# Propuesta: P-01 — Consulta de matriz mensual por empleado y lugar

**Fecha:** 2026-09-17
**Origen:** admin_web_app / leader
**Estado:** aplicada
**Nota (2026-09-17, orchestrator):** ratificada por el humano en segunda ronda: ruta `GET /records/monthly`, tipos, filtros (siteId = provincia del lugar, conjunción en el mismo día), totales, orden fijo y snapshot con **TTL 15 min** + errores 410/400. Todo en `docs/arquitectura/contratos-api.md` (decisión 8). Resta ejecución de backend: materializar DTOs y entregar los ejemplos de evidencia (bisiesto, 31 días, dos páginas, concurrencia).
**Responsable propuesto:** leader backend; decisión del humano; propagación por orchestrator.
**Módulos afectados:** F-006 y F-010. No bloquea infraestructura F-002.

## Archivo(s) común(es) afectado(s)

- `docs/arquitectura/contratos-api.md` (vía template/orchestrator).
- Coordinación externa: `backend_api_gdes/docs/03-contratos-api.md` y `07-convenciones.md`.
- Fuente funcional: spec §§8, 12–25, 59, 65, 66, 82–84 y plan aprobado.

## Problema

`GET /records` pagina registros diarios con intervalos anidados. Una página puede cortar una fila mensual empleado–lugar y no permite distinguir una fecha vacía de otra todavía no recibida. El humano eligió una matriz mensual, solo combinaciones con actividad, y propuso paginar filas completas. Reagrupar todas las páginas en el navegador contradice la estrategia server-driven.

## Cambio propuesto

**Todo endpoint, tipo y campo nuevo de este documento es candidato, no contrato vigente ni autorización para implementarlo.** Mantener `/records` y su detalle; añadir `GET /records/monthly` bajo `/api/v1` para ADMIN/SUPER_ADMIN.

Semántica candidata:
- Un solo mes y año obligatorios, `page` base 1, `pageSize` default 50/máximo propuesto 100, alineado con el límite general vigente.
- Filtros organizativos seleccionan filas. `siteId` refiere a la provincia del lugar, no a la provincia personal del empleado (requiere aprobación explícita).
- Filtros de estado/revisión/origen/ausencia seleccionan filas cuando al menos UN MISMO registro diario satisface su conjunción. Devolver todos los días de esas filas, incluidos registros que no coinciden, con `matchesFilters=false`.
- No sintetizar filas sin actividad del mes. No hay asignaciones permanentes. Una ausencia sí cuenta como actividad.
- Cada fila contiene exactamente los 28/29/30/31 días ordenados del mes. EMPTY es ausencia confirmada en el snapshot; PRESENT siempre conserva ID, aunque no coincida. LOADING/ERROR son estados locales, nunca EMPTY.
- `employeeId` en filtros es UUID de User; el legajo se representa como `employee.employeeId`. No confundir ambos strings.
- Orden propuesto fijo: apellido, nombre, nombre de lugar, UUID de empleado, UUID de lugar; backend define collation. Cualquier sort configurable adicional se acuerda antes.
- Totales de fila: minutos de todos sus registros del mes y, por separado, minutos de los registros coincidentes. Totales globales: suma sobre TODAS las filas seleccionadas, no solo la página. No afirmar que son totales de filas excluidas.
- Para impedir omisiones por desplazamiento entre páginas, proponer snapshot de lectura opaco ligado a usuario/filtros/orden. Primera página lo crea; siguientes lo envían y reciben filas/totales del mismo snapshot. TTL, costo y estrategia backend pendientes. Al mutar o actualizar manualmente, descartar páginas y comenzar nuevo snapshot. Nunca mezclar versiones. Lecturas históricas no autorizan escrituras: el POST revalida unicidad y permisos actuales.

### Tipos candidatos (solo documentación)

```ts
type RecordStatusCandidate = "COMPLETE" | "INCOMPLETE";
type ReviewStatusCandidate = "NONE" | "PENDING" | "APPROVED" | "MANUAL_LOADED";
interface MonthlyQueryCandidate {
  month: number;
  year: number;
  page?: number;
  pageSize?: number;
  siteId?: string;
  employeeId?: string;
  workplaceId?: string;
  clientId?: string;
  status?: RecordStatusCandidate;
  reviewStatus?: ReviewStatusCandidate;
  origin?: "AUTOMATIC" | "MANUAL";
  hasAbsence?: true;
  snapshotToken?: string;
}
type DayCandidate =
  | { date: string; state: "EMPTY" }
  | {
      date: string;
      state: "PRESENT";
      matchesFilters: boolean;
      record: {
        id: string;
        totalWorkMinutes: number;
        recordStatus: RecordStatusCandidate;
        reviewStatus: ReviewStatusCandidate;
        origin: "AUTOMATIC" | "MANUAL";
        hasAbsence: boolean;
        intervalCount: number;
      };
    };
interface MonthlyRowCandidate {
  employee: { id: string; firstName: string; lastName: string; employeeId: string };
  workplace: { id: string; name: string };
  client: { id: string; name: string };
  site: { id: string; name: string };
  days: DayCandidate[];
  totals: { monthWorkMinutes: number; matchingWorkMinutes: number };
}
interface MonthlyResponseCandidate {
  data: MonthlyRowCandidate[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  meta: {
    month: number;
    year: number;
    timeZone: "-03:00";
    snapshotToken: string;
    snapshotExpiresAt: string;
    totals: { monthWorkMinutes: number; matchingWorkMinutes: number };
  };
}
```

`date` es fecha GMT-3 `YYYY-MM-DD`; expiración UTC. Minutos y contadores son enteros no negativos. `totalItems` cuenta filas, no días. Los tokens de snapshot no son credenciales y nunca eluden autorización del backend. Los intervalos/metadata se consultan al abrir detalle, no una request por celda durante render.

### Ejemplos para validar semántica

Consulta candidata: `GET /api/v1/records/monthly?year=2026&month=9&status=INCOMPLETE&page=1&pageSize=50`.

Extracto de tres celdas de una fila (NO respuesta completa; las restantes fechas deben estar presentes):

```json
[
  { "date": "2026-09-01", "state": "EMPTY" },
  { "date": "2026-09-02", "state": "PRESENT", "matchesFilters": false,
    "record": { "id": "11111111-1111-4111-8111-111111111111", "totalWorkMinutes": 480, "recordStatus": "COMPLETE", "reviewStatus": "NONE", "origin": "AUTOMATIC", "hasAbsence": false, "intervalCount": 1 } },
  { "date": "2026-09-03", "state": "PRESENT", "matchesFilters": true,
    "record": { "id": "22222222-2222-4222-8222-222222222222", "totalWorkMinutes": 0, "recordStatus": "INCOMPLETE", "reviewStatus": "PENDING", "origin": "AUTOMATIC", "hasAbsence": false, "intervalCount": 1 } }
]
```

El día 2 no permite crear un duplicado aunque el filtro sea INCOMPLETE. Un error de página siguiente conserva páginas anteriores y muestra reintento, no nuevas celdas vacías. Crear sobre EMPTY puede recibir conflicto por escritura posterior al snapshot: recuperar registro, nunca sobrescribir.

Errores candidatos adicionales: `410 MONTHLY_SNAPSHOT_EXPIRED` y `400 MONTHLY_SNAPSHOT_MISMATCH`, ambos `retryable=false`. Caducidad permite reiniciar lectura desde página 1; no reintentar la misma página/token. Confirmar nombres en catálogo 07. Errores de auth/validación mantienen envelope vigente.

## Impacto por app

- Admin: adaptador nuevo e infinite query por filas, detalle bajo demanda y reinicio tras escrituras.
- Backend: consulta/agregación/snapshot, índices y tests de consistencia; no modificación del pipeline de eventos.
- Mobile: sin cambios de payload ni obligación de consumir esta ruta.

## Preguntas restantes

1. ¿Se aprueban ruta, tipos, `siteId` del workplace y conjunción en el mismo día?
2. ¿Se aprueban totales sobre filas seleccionadas y días no coincidentes visibles?
3. ¿Qué TTL/implementación de snapshot, collation y límite de filas valida backend? ¿Se acepta la ampliación `meta` del envelope?
4. ¿Cuáles son los DTOs completos de detalle y el conflicto de creación de P-04?

## Criterio de desbloqueo y evidencia

Humano ratifica decisiones/types y backend entrega ejemplos completos de febrero bisiesto y mes de 31 días, filas con estados mezclados, cero filas, dos páginas y escritura concurrente. Orchestrator propaga contrato y códigos; reviewer coteja fixtures. Solo entonces escribir servicio/mock contractual F-006. F-010 añade evidencia con datos reales de prueba y métricas de carga. No hay aprobación ni implementación implícita en esta propuesta.
