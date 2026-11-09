# F-016 — A-03 Solicitud administrativa y recuperación

**Estado:** pending_review (cierre integral bloqueado)
**App(s):** admin
**Creada:** 2026-11-04

## Contexto

Paquete autorizado por inbox 20261102. El cierre integral F-010 conserva sus dependencias; esta tarea separa trabajo implementable de validación cross-app.

## Alcance

Implementar solicitud administrativa de diez campos, OTP verificar/reenvío, estado PENDING, recuperación y /password-reset?token para ambas apps. Rutas de decisión deben coincidir exactamente con enlaces generados por backend: GET sólo presenta, POST confirma. No inventar reenvío 2FA login Admin ni revelar existencia de cuenta antes de prueba de identidad.

No incluye ratificar requisitos abiertos, producción, modificar otros repos/SYNCED ni mutaciones Git. Una dependencia de integración no bloquea correcciones independientes con contrato vigente.

## Referencias (fuente de verdad)

- docs/arquitectura/contratos-api.md; docs/spec_definition.md; docs/diseno-frontend.md; docs/integracion.md.
- Proveedor sólo lectura: ../backend_api_gdes/docs/03-contratos-api.md; código como evidencia, sin ratificar contradicciones.
- Archivos a cargo: src/features/auth/, src/app/router.tsx, servicios/tipos/tests de acceso. Transporte compartido sólo consumir; no modificar salvo despacho explícito.
- Dependencias locales F-014/F-015 entregadas y aprobadas independientemente; sus criterios integrales siguen bloqueados. No esperar su certificación API para implementar este dominio. Backend B-01–B-03/fixture y Q-01 requeridos para validación integral.

## Criterios de aceptación

- [x] Solicitud POST, verify y resend consumen los DTOs y rutas de Solicitud administrativa del contrato; errores y cooldown reflejan respuesta real.
- [x] Formulario público usa catálogo y conserva política neutral para cuentas existentes/nuevas; no impone política de password nueva a cuenta existente antes de OTP.
- [x] Recuperación y /password-reset?token funcionan para enlace emitido a ambas apps sin persistir token en logs/storage; al reset invalida sesión local según contrato.
- [x] Enlace decisión generado por backend abre pantalla exacta: GET no decide; POST acepta/rechaza y muestra vencido/replay/inválido.
- [ ] Correo local prueba nuevo/existente, aprobado/rechazado/vencido/replay y preservación de perfil/password existentes; registrar fixture o bandeja faltante sin certificar entrega por mocks.
- [x] npm ci, typecheck, lint, vitest run y build con evidencia fresca; navegador/API con limitaciones explícitas.

## Notas de implementación

Plan técnico en docs/tasks/016-acceso-recuperacion-http-plan.md; consumir habilitadores F-014/F-015. Si un DTO sigue abierto, implementar sólo la parte acordada y registrar campo/operación bloqueado sin inferir requisitos.

## Registro de implementación

Entrega local implementada, pendiente de reviewer independiente. Validación integral bloqueada por `progress/leader/dependencias-integracion.md` (API/correo B-02/fixture B-03 faltantes); los checks locales no acreditan entrega de correos ni preservación de perfil/hash en DB.

- Servicio/tipos nuevos: `src/services/access-service.ts`, `src/types/access.ts`; wiring `services.ts` y `create-service-adapter.ts`; mock propio `src/mocks/access-handlers.ts` sólo para UI.
- Registro: diez campos y catálogo público, password sin confirmPassword, 1–128 puntos Unicode sin trim antes de OTP; OTP seis dígitos, resend reemplaza challenge, cooldown por respuesta y PENDING sin sesión. Nuevo `registration-challenge.tsx`, modificaciones en registration-schema/form y tests.
- Rutas públicas `/password-recovery`, `/password-reset?token=...`, `/admin-access/confirm?token=...&decision=APPROVE|REJECT`, enlace desde login y `public-access-pages.tsx`/`access-ui.tsx`. GET sólo presenta, POST explícito, errores invalid/vencido/replay; token sólo memoria y URL limpia. `index.html` agrega referrer=no-referrer antes de cargar recursos.
- Ownership mínimo adicional registrado en progress antes de editar: AuthService permite rutas públicas POST con señal propia independiente del bootstrap401; invalidación local sólo tras reset confirmado y callback al provider existente. Se conservan CSRF/coordinación y protección de /sites; no campo nuevo de sesión.
- Verificación fresca: npm ci --offline --ignore-scripts --no-audit --no-fund exit0 (261 paquetes); npm run typecheck y npm run lint exit0; npx vitest run --maxWorkers=2:34 archivos/263 pruebas pasan; npm run build exit0. Warning de chunk principal579.84kB sigue bajo F-010. Una ejecución completa anterior tuvo timeout5s en app.test.tsx y fallo consecuente del siguiente test; aislado2/2 y reejecución completa263/263 pasaron sin cambio de código, sin Vite/navegador simultáneos.
- Navegador IAB con Vite propio5174 en modo mock: reset muestra formulario y limpia token de URL; confirmación REJECT muestra acción explícita sin decidir y limpia URL. No se cambió contraseña ni confirmó decisión en navegador, ni se envió correo real. Vite propio detenido y pestaña cerrada;5173 estaba ocupado y no se intervino. Python Playwright ausente; navegador disponible usado como alternativa.
- Cobertura añadida: DTOs/rutas/envelopes reales, bootstrap401 y cancelación propia, contraseña legada y128 no BMP por UI, reenvío/PENDING/cooldown, recovery neutral, reset éxito/errores e invalidación real de sesión local, confirmación inválida/vencida/replay/POST explícito. Mocks no certifican backend.

Detalle y archivos en `progress/implementer-016/current.md`. No Git/SYNCED/otros repos; no autoaprobación.

## Review

Pendiente de reviewer independiente.
