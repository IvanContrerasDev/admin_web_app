# Plan F-014 — transporte y sesión

Para implementer-admin. Ejecución autorizada en inbox; flujo leader→implementer→reviewer. Sin commits ni worktrees.

1. Leer contrato sesión y proveedor, inspeccionar AuthProvider real y tests existentes. Contrastar bootstrap, CSRF y challenge con handlers backend sin elevar comportamiento no acordado. Registrar diferencias/bloqueos en progress/implementer/current.md.
2. En src/services/http-service-adapter.ts y sus tests, fijar regresión de base `https://localhost:3000/api/v1` + `/users` → `/api/v1/users`, query escapada, credentials, 204, error y AbortSignal. Implementar composición y transporte sin fallback.
3. En auth-service/types/auth y login-page, probar challenge mínimo real y bootstrap anónimo; adaptar schemas/UI para no depender de message/expiresAt ausentes. Mantener challenge mock compatible y UX sin TTL inventado.
4. Implementar integración de credenciales sólo en memoria y CSRF según GET `/auth/web/csrf` y `X-CSRF-Token`. Cubrir preauth, verify, refresh y cambios de sesión. No persistir access en local/sessionStorage ni enviar refresh JSON.
5. En AuthProvider y transporte, probar single-flight de 401/expiración, coordinación con Web Locks/BroadcastChannel, timeout de refresh sin repetición, logout durante refresh y respuesta tardía. Implementar control local de vigencia y limpieza Query/cancelación. Las APIs no soportadas y offline siguen abiertos: no inventar fallback.
6. Ejecutar npm ci, npm run typecheck, npm run lint, npx vitest run, npm run build. Corregir sólo regresiones propias; dejar evidencia de comandos y límites.
7. Con stack/fixture autorizados ya disponibles, correr navegador real dos pestañas y verificar cookies, CSRF, recarga y logout. Si no disponible, registrar qué dependencia concreta falta, sin afirmar integración completa. Completar Registro y devolver paths/status.

## Foco de revisión

Doble refresh entre tabs; carrera logout/respuesta; pérdida ambigua de refresh; challenge mínimo; bootstrap 401. Cada caso requiere prueba propia en el paso que lo implementa; cookies requieren navegador.
