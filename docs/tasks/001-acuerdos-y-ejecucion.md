# F-001 — Formalizar acuerdos y organizar la ejecución

**Estado:** in_progress
**App(s):** admin; coordinación documental con backend y mobile
**Creada:** 2026-09-17

## Contexto

El humano aprobó una implementación incremental de diez etapas, empezando únicamente por F-001. El repositorio todavía no contiene una aplicación. Antes de crear servicios se necesitan una hoja de ruta durable, trazabilidad de la especificación y propuestas explícitas para las diferencias con el backend. La aprobación del plan no aprueba automáticamente nuevos DTOs.

## Alcance

**Incluye:**
- Persistir la hoja de ruta y las decisiones confirmadas.
- Registrar F-001 a F-010, dependencias técnicas y contractuales; solo F-001 activa.
- Matriz de las 95 secciones con criterios y evidencia futura, incluidas exclusiones expresas.
- P-01 a P-05 con responsable, problema, texto/tipos candidatos, impacto y condiciones de desbloqueo.
- Estado verificable del leader y preparación para revisión independiente.

**NO incluye:**
- Aplicación, dependencias, pantallas, mocks ejecutables, autenticación o servicios reales.
- Modificar la spec original, contratos sincronizados, templates o adjuntos del backend.
- Aprobar contratos, cambios en otros repos, infraestructura, publicación o iniciar F-002.
- Presentar comprobaciones propias como veredicto del reviewer.

## Referencias (fuente de verdad)

- [Hoja de ruta aprobada](001-acuerdos-y-ejecucion-plan.md).
- [Spec completa](../spec_definition.md), [contratos vigentes](../arquitectura/contratos-api.md).
- [Flujo del harness](../convenciones/flujo-de-trabajo.md), [plantilla](TEMPLATE.md).
- Referencias backend aportadas: `backend_api_gdes/docs/02-modelo-de-datos.md`, `03-contratos-api.md`, `04-auth-y-seguridad.md`, `05-asistencia-eventos-y-registros.md`, `06-integraciones.md`, `07-convenciones.md`. Son documentos externos leídos como adjuntos, no rutas disponibles en este checkout ni evidencia de endpoints desplegados.
- [Matriz de cobertura](001-acuerdos-y-ejecucion-cobertura.md).

## Criterios de aceptación

Comprobación propia del leader; los checks no equivalen al veredicto independiente de CA-08.

- [x] CA-01: hoja de ruta local conserva las diez etapas, decisiones, criterios y límites aprobados.
- [x] CA-02: JSON válido, diez IDs únicos, dependencias existentes y acíclicas, una sola feature in_progress; ninguna marcada done sin review.
- [x] CA-03: §§1–95 aparecen una vez cada una en la matriz, asignadas a feature y comprobación o exclusión expresa; las subsecciones se enumeran donde contienen flujos independientes.
- [x] CA-04: P-01 a P-05 están pendientes, cada una con responsable propuesto, módulos afectados, ejemplos, preguntas y evidencia de desbloqueo.
- [x] CA-05: decisiones del humano separadas de contratos ratificados; ausencia sin horas, medianoche y solicitud completa trazables.
- [x] CA-06: F-002 puede preparar infraestructura frontend sin esperar contratos de dominios; ningún servicio o mock dependiente usa tipos candidatos sin aprobación.
- [x] CA-07: Git diff sin código de producto ni modificaciones de fuentes sincronizadas; referencias locales válidas.
- [ ] CA-08: reviewer independiente verifica CA-01 a CA-07; leader cierra y archiva después del veredicto, no antes.

## Notas de implementación

### Decisiones confirmadas y precedencia

| Decisión | Evidencia de origen | Tratamiento local |
|---|---|---|
| React + Vite + TypeScript; matriz mensual, filas empleado–lugar con actividad | Hoja de ruta aprobada §§2 y 4 | Base F-002; consulta candidata P-01, sin descargar todo el mes para reagrupar |
| Refresh HttpOnly y access en memoria | Hoja de ruta aprobada §2.5 | P-02; no sustituir por almacenamiento persistente de tokens |
| Diez campos y verificación previa de solicitud administrativa | Respuesta explícita del humano y plan §2.6 | P-03; no crear cuentas mínimas ni sobrescribir existentes |
| ABSENCE sin extremos completa, CLOSED, cero trabajo | Respuesta explícita del humano y plan §2.7 | P-04; formalización backend pendiente |
| Medianoche mantiene dos fechas GMT-3 | Respuesta explícita del humano y plan §2.8 | P-04; sin emparejar días diferentes |
| TO_BE_ADMIN no accede a mobile | Contrato sincronizado, decisión 6 | Prevalece sobre §§5/10.3 antiguos; mostrar mensaje pendiente en web |
| UTC de transporte / GMT-3 del día lógico | Backend 03/05/07, plan §3 | No usar zona local del navegador |
| Último intervalo abierto del mismo día | Backend 05 y regla textual §23 | Fixture 09/11/12/18 produce 09–18 y 11–12; no copiar ejemplo contradictorio |
| R2 vía backend; 20 MB y diez archivos | Backend 06/07 | Sin SDK de almacenamiento ni proveedor alternativo en admin |

### Índice de propuestas y responsables propuestos

Los roles siguientes son destinatarios de coordinación, no evidencia de que ya recibieron una asignación. El humano decide; el leader backend concreta DTOs; el orchestrator actualiza y propaga el conocimiento común; el reviewer exige evidencia.

| ID | Documento | Responsable técnico / decisión | Afecta / desbloqueo |
|---|---|---|---|
| P-01 | [Matriz mensual](../changes_proposals/20260917-p01-matriz-mensual.md) | Leader backend + humano | F-006/F-010; request, respuesta y consistencia de páginas ratificados |
| P-02 | [Sesión web](../changes_proposals/20260917-p02-sesion-web.md) | Leader backend/seguridad + humano | F-003/F-010; transporte, CSRF y rotación aprobados |
| P-03 | [Solicitud administrativa](../changes_proposals/20260917-p03-solicitud-administrativa.md) | Leader backend/auth + humano | F-003/F-010; identidad, payload y correos aprobados |
| P-04 | [DTOs y reglas](../changes_proposals/20260917-p04-dtos-y-reglas.md) | Leaders backend/mobile/admin + humano | F-003–F-009/F-010, por subacuerdo; ejemplos/tipos/errores completos |
| P-05 | [Mapa y direcciones](../changes_proposals/20260917-p05-mapa-y-direcciones.md) | Humano/operaciones + leader admin | F-005/F-010; proveedor y acceso aprobados |

No se bloquea toda la base técnica por un subacuerdo de otro módulo. F-002 queda pendiente en backlog por el proceso de revisión/entrega, no por necesitar P-01 a P-05 completas. Su task spec se crea al tomarla.

## Registro de implementación

Preparación documental realizada por el leader/v0. No hubo implementación de producto ni delegación a implementer, porque esta tarea corresponde a coordinación del leader.

Archivos previstos: este task spec, plan y cobertura adyacentes, cinco propuestas fechadas, `feature_list.json` y `progress/leader/current.md`.

Comprobaciones propias ejecutadas el 2026-09-17:
- Validación Node (solo lectura): JSON válido, 10 IDs únicos, dependencias existentes/acíclicas, solo F-001 in_progress, ninguna done; rutas de plan/task spec existentes y dependencias P-01…P-05 válidas.
- Matriz: 95 filas numeradas correlativamente, cada sección 1–95 una vez. Contraste manual de reglas/subsecciones con spec y referencias backend; sujeto a reviewer.
- 17 enlaces Markdown locales comprobados; bloques de código balanceados.
- Cinco propuestas con estado pendiente y apartados de problema/propuesta/impacto/preguntas/desbloqueo.
- Whitelist de Git: exactamente 10 archivos documentales/de coordinación afectados; spec, contratos sincronizados, templates, adjuntos y código de producto intactos.
- `git diff --check`: sin errores.

El primer intento del checker falló por aplicar `trim()` a `git status --porcelain`, quitando un espacio significativo del primer nombre; se corrigió el checker a salida `-z`, sin cambiar archivos de producto, y la validación completa pasó (exit 0).

No hay package.json ni superficie ejecutable: build, lint, tests de aplicación y navegador no aplican a F-001. Las pruebas indicadas en la matriz son futuras, no resultados de esta entrega.

## Review

Pendiente de reviewer independiente. La herramienta de delegación del harness no está disponible en esta sesión; no se registra una ronda ficticia ni un veredicto aprobado. F-001 se mantiene in_progress hasta revisión y cierre por el leader.
