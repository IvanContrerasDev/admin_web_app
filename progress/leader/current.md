# Estado actual — leader Admin

## Entrega vigente
F-020 done local; reviewer independiente aprobado, 0 ítems. npm run dev fuerza HTTP localhost5173; npm run demo fuerza mocks actuales localhost5174; strictPort y precedencia explícita sobre .env/shell heredados. API DEV default http://localhost:3000/api/v1 personalizable mediante VITE_API_BASE_URL. Definición vigente y comandos en docs/integracion.md, resumen en docs/diseno-frontend.md; examples actualizados. Spec/plan/inbox resueltos retirados.

Implementer y reviewer comprobaron 41/41 focalizadas config/fábrica/transporte/auth/sesión, build/tsc y lint exit0. Dos bundles en memoria ejecutan import.meta.env entero con env opuestos; reviewer comprobó precedencia de vite:import-analysis en serve. Mock mutations sin fetch y reinicio de fixtures probados. No nuevos datos, contratos, dependencias ni cambios a fábrica/mocks.

## Pendiente runtime a cargo del orchestrator
Root levanta ambos comandos y prueba navegadores/puerto ocupado. No se inició Vite desde esta tarea ni se afirma aceptación física DEMO/DEV. DEMO usa marina.quiroga@example.test / contraseña no vacía /123456; estado solo memoria de pestaña, recarga reinicia. DEV requiere credenciales/OTP reales, errores API no caen a mock.

## Límites vigentes
No Git ni backend/mobile/SYNCED. Usuario comunicó «Ya hice las pruebas en local, funcionó» según inbox root: evidencia humana del recorrido anterior, sin certificar OAuth/uploads/otros abiertos. Pendientes integrales previos conservados sin cambiar estados ni aprobaciones ajenos a F-020. Inbox LAN y decisiones abiertas permanecen.
