# Current — admin

## Tarea activa
F-007, F-008 y F-009 implementadas mock-first; pendientes de revisión independiente y materialización backend.

## Haciendo ahora
Sesión de continuación: se implementaron Planillas, Legajos digitales e Inicio operativo siguiendo los patrones mock-first existentes. Verificación completa en verde (typecheck, lint, 62 tests) y flujos validados en navegador real con Playwright.

## Hecho (esta sesión)
- **F-007 Planillas** (`docs/tasks/007-planillas.md`): listado paginado con filtros (empleado, lugar, período, estado), carga multi-archivo (cada archivo crea una planilla del mismo período), detalle con cambio de estado (Pendiente/Cargada/Error), reemplazo de archivo y descarga con enlace firmado simulado. Validación de formato (PDF/JPG/JPEG/PNG/DOC/DOCX/TXT) y tamaño (20 MiB, hasta 10 archivos) centralizada en `src/lib/attachments.ts`.
- **F-008 Legajos digitales** (`docs/tasks/008-legajos-digitales.md`): listado paginado con filtros (búsqueda, tipo, empleado, cargado por, rango de fechas de carga), carga con validación, detalle con edición de nombre y tipo, eliminación con confirmación y descarga simulada. Tipos de documento: DNI, Contrato, Certificado médico, Ficha médica, ART, Documentación EPP, Normas internas, Declaración de domicilio, Otros.
- **F-009 Inicio operativo** (`docs/tasks/009-inicio-operativo.md`): dashboard con selector de mes y 4 tarjetas de métricas del período (planillas pendientes, registros incompletos, pendientes de validación, registros con ausencia). Cada tarjeta enlaza a la vista filtrada correspondiente del mismo período. Sin páginas locales nuevas.
- Servicios `timesheets-service`, `documents-service`, `dashboard-service` con sus mocks, tipos y tests de servicio.
- `module-pages.tsx` eliminado: Planillas y Legajos ahora tienen páginas reales.
- Verificación en navegador: login 2FA, navegación SPA, listados, diálogos de detalle, carga de planilla (10→11 filas) y enlaces del dashboard con query params correctos. Sin errores de página.

## Blockers / Preguntas para el humano
- Las métricas del dashboard se calculan sobre la generación determinista de registros; los registros manuales creados en runtime no se reflejan (limitación del mock, sin efecto en backend real).
- La descarga de archivos usa `URL.createObjectURL` con fallback a URL simulada (jsdom no implementa `createObjectURL`).
- Revisión independiente y materialización backend pendientes (a cargo del humano/orchestrator).

## Resultado final
F-007, F-008 y F-009 quedan listas en modo mock-first con cobertura de servicio y verificación en navegador. El MVP queda completo a nivel frontend mock; resta la integración real (F-010) y las revisiones independientes.
