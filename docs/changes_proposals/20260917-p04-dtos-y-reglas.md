# Propuesta: P-04 — Cierre de DTOs, validaciones y operaciones

**Fecha:** 2026-09-17
**Origen:** admin_web_app / leader
**Estado:** aplicada
**Nota (2026-09-17, orchestrator, segunda ronda):** ratificada por el humano: concurrencia por **`expectedVersion`**, solapamientos **rechazados** en carga manual (históricos intactos), no se aceptan WORK sin ambos extremos ni registros sin intervalos en carga manual, identidad empleado/lugar/fecha inmutable en PATCH, motivo de ausencia **opcional siempre**, flujo revisión pura vs MANUAL_LOADED, cargas retrospectivas permitidas como corrección histórica, **20 MiB** por archivo y lote **atómico**, búsqueda por fileName+nombre/apellido/legajo, dashboard con contadores del **mes seleccionado**. Todo en `docs/arquitectura/contratos-api.md` (decisión 11). Resta ejecución de backend: DTOs completos por recurso, políticas de validación, ejemplos y pruebas.
**Responsables propuestos:** leader backend por DTO/regla; leader mobile por compatibilidad; humano ratifica; orchestrator propaga.
**Módulos afectados:** F-003 a F-009 y F-010, según cada subacuerdo. No bloquea infraestructura de F-002.

## Archivo(s) común(es) afectado(s)

- `docs/arquitectura/contratos-api.md`.
- Coordinación externa: backend `02-modelo-de-datos.md`, `03-contratos-api.md`, `04-auth-y-seguridad.md`, `05-asistencia-eventos-y-registros.md`, `06-integraciones.md`, `07-convenciones.md`.
- Referencia funcional: spec §§7–40, 47–48 y Parte 8.

## Problema

Los documentos describen entidades Prisma y endpoints, pero no todos los cuerpos, respuestas, nullables, búsquedas y conflictos necesarios para implementar servicios equivalentes. Una entidad de base de datos no es un DTO público: incluye passwordHash, fileKey u otros campos que no deben filtrarse a la UI. Las decisiones de ausencia sin horas y medianoche necesitan formalización para no generar inconsistencias.

## Cambio propuesto

**Todos los tipos/campos/rutas nuevos siguientes son candidatos. No generan archivos TypeScript ni modifican contratos originales.** Cada subacuerdo puede desbloquear su servicio de forma independiente cuando se ratifique su contrato completo. Los ejemplos son casos para discutir, no API disponible.

### P-04.A — Escrituras de registros e intervalos (F-006)

Candidato: `POST /records` crea registro completo; `PATCH /records/{id}` permite corregir uno incompleto, agregar intervalos o modificar existentes. Mantener la identidad empleado/lugar/fecha inmutable en PATCH hasta que el humano decida si puede cambiar; no asumir que “edición total” autoriza moverla.

```ts
type IntervalInputCandidate = {
  type: "WORK" | "ABSENCE";
  startTime: string | null;
  endTime: string | null;
  absenceReason: "ILLNESS" | "VACATION" | "LEAVE" | "ART" | "OTHER" | null;
  observations: string | null;
};
interface CreateRecordCandidate {
  userId: string;
  workplaceId: string;
  date: string;
  observations: string | null;
  intervals: IntervalInputCandidate[];
}
type IntervalChangeCandidate =
  | { operation: "ADD"; interval: IntervalInputCandidate }
  | { operation: "UPDATE"; id: string; interval: IntervalInputCandidate };
interface UpdateRecordCandidate {
  expectedVersion: number;
  observations?: string | null;
  intervalChanges?: IntervalChangeCandidate[];
}
interface ReviewRecordCandidate {
  expectedVersion: number;
  reviewStatus: "APPROVED" | "REJECTED";
}
```

- `expectedVersion` y operaciones ADD/UPDATE son propuesta explícita de concurrencia e identidad, NO campos vigentes. Backend incrementaría versión e impediría pérdida de cambios. Alternativa ETag/If-Match debe acordarse en lugar de implementar ambas.
- PATCH omitido conserva valor; null borra solo campo nullable. Intervalos no mencionados se preservan. No hay operación DELETE ni omisión como borrado. Sin autorización expresa tampoco eliminar intervalos persistidos desde UI.
- Intervalo UPDATE debe pertenecer al registro; ID ajeno se rechaza. Campos derivados (`totalWorkMinutes`, estados de completitud, origen) no vienen del cliente. Backend devuelve detalle completo recalculado y nueva versión.
- Fechas de extremos ISO UTC; `date` es día GMT-3. Validar parseo estricto, minutos y límites de día. Pendiente definir precisión segundos/milisegundos, límites inclusivos/exclusivos, igualdad inicio=fin, fecha futura, cantidad de intervalos y máximo de observaciones. No inventar estas reglas en Zod.
- Resolver si solapamientos se rechazan, se advierten o se conservan como evidencia de marcaciones; no impedir abrir/corregir datos históricos aunque una nueva entrada manual no los admita.
- Candidatos de error: `409 RECORD_ALREADY_EXISTS`, `409 RECORD_VERSION_CONFLICT`, `retryable=false`; ratificar en catálogo 07. Conflicto de versión mantiene formulario y ofrece recargar/comparar, nunca sobreescribe automáticamente.

Ejemplo de alta candidata de ausencia completa:

```json
{
  "userId": "44444444-4444-4444-8444-444444444444",
  "workplaceId": "55555555-5555-4555-8555-555555555555",
  "date": "2026-09-17", "observations": null,
  "intervals": [{ "type": "ABSENCE", "startTime": null, "endTime": null,
    "absenceReason": "OTHER", "observations": null }]
}
```

Respuesta requerida para ese caso: detalle con un intervalo CLOSED, registro COMPLETE, totalWorkMinutes=0, origen MANUAL, reviewStatus=MANUAL_LOADED, IDs y versión si se ratifica. No exigir observación por OTHER.

### P-04.B — Completitud, proyección y revisión (F-006)

**Decisiones ya confirmadas por humano**, a incorporar textualmente en backend:

| Tipo / extremos | Estado intervalo | Aporte de trabajo | Completitud del registro si es su único intervalo |
|---|---|---|---|
| WORK / inicio y fin válidos | CLOSED | diferencia en minutos | COMPLETE |
| WORK / solo inicio | OPEN | 0 | INCOMPLETE |
| WORK / solo fin | SEMI_CLOSED | 0 | INCOMPLETE |
| ABSENCE / sin ambos extremos | CLOSED | 0 | COMPLETE |
| ABSENCE / solo inicio | OPEN | 0 | INCOMPLETE |
| ABSENCE / solo fin | SEMI_CLOSED | 0 | INCOMPLETE |
| ABSENCE / ambos válidos | CLOSED | 0 | COMPLETE |

WORK sin ambos extremos y registro sin intervalos: validación pendiente; no aceptar por defecto. Total es suma de WORK cerrados; ningún campo de horas de ausencia. ABSENCE sin motivo ya puede llegar desde mobile: ratificar si motivo es obligatorio para carga manual y cómo se muestra null sin inventarlo.

Medianoche: entrada `2026-09-18T02:50:00Z` corresponde al 17/09 23:50 GMT-3, salida `2026-09-18T03:10:00Z` al 18/09 00:10. Mantener dos registros: 17/09 OPEN y 18/09 SEMI_CLOSED, ambos incompletos y cero trabajo cerrado. No cerrar automáticamente entre fechas ni fusionarlos en UI.

Algoritmo vigente: cada entrada agrega intervalo y cada salida cierra el último abierto del mismo registro diario. Entrada 09:00, entrada 11:00, salida 12:00, salida 18:00 produce 09:00–18:00 y 11:00–12:00: total 600 minutos según suma vigente (aunque se solapan), no el ejemplo contradictorio del §23. La política de nuevas ediciones solapadas no altera silenciosamente la proyección automática existente. Eventos offline fuera de orden necesitan ejemplos del backend, no una reconstrucción inventada por admin.

Separación pendiente de ratificar:
- Cambio de datos/observaciones por admin: registro MANUAL/MANUAL_LOADED; intervalos efectivamente editados MANUAL. Para edición solo de observación general, aclarar cómo se concilia origen derivado de intervalos con la intervención global; no marcar arbitrariamente todos los intervalos como manuales.
- Revisión pura: propuesta conservar origen/horarios y permitir PATCH de APPROVED/REJECTED sin convertirlo en edición manual. Confirmar estados de origen/transiciones y comportamiento de REJECTED → corregido (MANUAL_LOADED) → APPROVED. Rechazado permanece visible y editable.
- Revisión de intervalo: falta operación exacta, permisos y efecto sobre revisión global. Candidato `PATCH /records/{recordId}/intervals/{intervalId}/review` con `{ expectedVersion, reviewStatus: APPROVED | REJECTED }`; compartir versión del registro y devolver detalle recalculado. Ratificar antes de servicio/UI de escritura.
- Metadata de eventos inmutable: edición manual no crea, actualiza ni borra AttendanceEvent. Recordar que el modelo 02 dice origen ADMIN posible, mientras doc 05 prohíbe generar eventos para estas correcciones; solicitar precisión sobre otros usos de ADMIN sin inferirlos.

### P-04.C — Lecturas, entidades y catálogos (F-003/F-004/F-005/F-006)

Publicar DTOs completos y allowlists de búsqueda/filtros/sort, no `any`, casts de Prisma ni nombres resueltos con una request por fila.

| Recurso | Respuesta/datos a ratificar | Validaciones/operaciones pendientes |
|---|---|---|
| Users lista/detalle | UUID, nombres, legajo, DNI, email, teléfono, domicilio, nacimiento, Site id/name, accountStatus; cuil/hireDate/position nullable | Lista de campos editables, roles incluidos en `/users`, unicidad, política de contraseña; sin password/hash en respuesta, sin edición de rol ni reset por admin |
| Clients | id/name/status y fechas según UI aprobada | Create/update/status y orden admitido; cliente sin lugares válido |
| Sites | id/name de seis provincias iniciales | Acceso público para formulario §10 y privado para selectores; sin CRUD de provincias |
| Workplaces ADMIN | id/name, client/site id/name, status, CIRCLE, lat/lon, radio, umbral nullable | Forma plana paginada admin vs agrupada mobile; exactitud numérica/límites; no copiar respuesta EMPLOYEE |
| Records detalle | Relaciones visibles, intervalos con ID/origen/revisión y eventos opcionales completos | Distinguir null de metadata desconocida; versión o ETag acordado; no listas de IDs que obliguen N+1 |
| Catalogs | Códigos string y labels españoles para ausencia/documentos | Autorización por catálogo; no exponer usuarios o datos operativos en endpoint público |

Ejemplo candidato de grupo organizativo reutilizable (no DTO completo de workplace):

```json
{ "client": { "id": "66666666-6666-4666-8666-666666666666", "name": "Cliente de prueba" },
  "site": { "id": "33333333-3333-4333-8333-333333333333", "name": "San Juan" } }
```

Ratificar política de contraseña compartida mobile/admin, reglas teléfono 10–13 dígitos y DNI 7–8 según modelo, normalización de email, campos opcionales y longitudes. No convertir cuil/hireDate/position en obligatorios ni elegir quién los carga. Reenvío 2FA ADMIN necesita endpoint/body/resultado propios ratificados (10 minutos, cinco intentos ya descritos; compatibilidad de resend por confirmar).

### P-04.D — Inactividad e historia (F-004/F-005/F-006/F-007/F-008)

Mantener bloqueo de INACTIVE y prohibiciones de borrado. Confirmar matriz de permisos:
- Cuenta inactiva no hace operaciones; admin conserva lectura histórica y debe acordar qué correcciones documentales/de registros históricos puede realizar para ella.
- Cliente/lugar inactivo deja de participar en operaciones futuras, pero sigue legible en historial. No desactivar filas hijas automáticamente ni cambiar retroactivamente nombres/relaciones sin decisión.
- Definir si una carga retrospectiva (registro nuevo de fecha pasada, planilla atrasada, documento) es corrección histórica permitida o nueva operación bloqueada. Hasta entonces no inventar excepción en selectores/servicios.
- Desactivación requiere confirmación; resolver validación de estado nuevamente al guardar si cambió mientras estaba abierto el formulario.

### P-04.E — Archivos y búsquedas (F-007/F-008)

| Contrato candidato | Decisión requerida |
|---|---|
| Admin `POST /timesheets`: multipart `employeeId` (UUID), `workplaceId`, `month`, `year`, `files` repetido | Falta employeeId admin explícito; mobile debe derivar usuario de sesión. Acordar nombre exacto de archivos y si admite uno/muchos |
| `POST /documents`: multipart employeeId UUID, type, workplaceId opcional y files | Acordar tratamiento del nombre visible para varios archivos y null de workplace |
| Respuesta múltiple propuesta `{ data: { created: [...] } }` | Preferencia candidata: lote atómico; backend define rollback de DB/bucket y garantías. Si parcial, requiere contrato alternativo por archivo con índice/código y estrategia de reintento sin duplicar |
| Reemplazo de planilla | Acordar ruta/campo/versionado concurrente, si vuelve a PENDING o conserva estado; no asumir. Confirmación de borrado permanente del anterior; jamás borrar original antes de confirmar nueva versión válida |
| Listados timesheets/documents con `search` | Candidato buscar fileName y nombre/apellido/legajo de empleado; precisar campos, normalización y combinación con filtros. No filtrar solo página local |
| Descarga de ambos | Vigente: `{ data: { downloadUrl } }`, firma 15 min; no persistir URL vencida como dato estable. Nuevo intento de descarga obtiene firma actual; no alterar query firmada |

20 MB por archivo, máximo 10 por request, extensiones pdf/jpg/jpeg/png/doc/docx/txt; backend valida contenido además de extensión. Ratificar si MB significa 20 000 000 o 20 × 1024 × 1024 bytes para bordes consistentes. Un lote de diez archivos permite hasta ~200 MB: comprobar límites reales del proxy/backend y estrategia antes de prometer que cualquier lote válido cabe en una request. No reducir el límite contractual silenciosamente.

Respuestas completas de planillas: empleado/lugar/cliente/provincia con nombres, mes/año/secuencia/estado, fecha de carga y uploader; ordenar año/mes/secuencia descendentes con desempate aprobado. Documentos: nombre visible/tipo/formato/empleado/uploader/createdAt/updatedAt; creación descendente con desempate. Edición documento solo nombre/tipo, no reemplazo o versionado nuevo sin acuerdo. Borrar documento sí; borrar planilla no. Upload no genera registros ni OCR ni enlaza certificados a ausencias.

### P-04.F — Métricas de Inicio (F-009)

Ratificar alcance temporal de `/dashboard/metrics` y semántica de `month/year/siteId` si se admiten: cuatro contadores globales del conjunto consultado, no suma de páginas UI. `absencesCount` debe contar registros con al menos una ABSENCE, no intervalos ni horas.

Candidato de contenido (nombres por confirmar): `{ data: { pendingTimesheets: 12, incompleteRecords: 8, pendingReviewRecords: 3, recordsWithAbsence: 4 } }`. Publicar nombres definitivos según endpoint existente antes del servicio. Definir período de planillas vs registros y contexto para los enlaces; la matriz solo admite un mes. Un contador histórico no puede enlazar a mes actual como si mostrara todos sus resultados. Confirmar período visible o selector que haga coherentes métrica y destino. Dashboard no incluye gráficos analíticos avanzados.

## Impacto por app

Backend mantiene reglas, atomicidad y autorizaciones; admin consume DTOs aprobados y muestra resultados, sin duplicar proyección como fuente de verdad; mobile conserva eventos/contratos vigentes salvo cambios expresamente coordinados. Modelo Prisma no debe exponer secretos ni keys privadas.

## Preguntas restantes y criterio de desbloqueo

Por cada subacuerdo A–F, el leader backend entrega rutas, requests, responses, nullables, ejemplos válidos/errores, permisos y pruebas de concurrencia correspondientes. Humano ratifica específicamente los tipos y políticas; orchestrator propaga; reviewer registra evidencia. No hace falta esperar A para desarrollar un servicio C ya ratificado. Las tablas anteriores enumeran preguntas pendientes, no las dan por resueltas. F-010 exige pruebas contra backend real de prueba, no solo fixtures.
