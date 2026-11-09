# Dependencias verificadas — integración Admin

Fuente de estado consultada: `../backend_api_gdes/progress/leader/current.md` y `../backend_api_gdes/progress/leader/integracion-local-entorno.md` (sólo lectura).

Backend B-01/F-010 consta cerrado con revisión independiente del runtime aislado. Su estado vigente indica B-02 correo local, B-03 fixtures opt-in/GPS y B-04 lugar null pendientes; recursos de smoke exclusivos retirados y entorno operativo del usuario no arrancado/migrado. Esto no bloquea implementación local A-01/A-02/A-04 ni tests de contrato, pero no acredita API local con cuentas/correo/datos aptos para navegador/Android.

Para verificar HTTP real se requiere que el proveedor entregue endpoint operativo, cuenta administrativa opt-in, bandeja local OTP y fixture compartido; no fabricar credenciales ni sembrar/restablecer cuentas desde Admin. Conservar Secure/HttpOnly y CSRF. No afirmar cookies o dos pestañas por jsdom. Si aparecen recursos reales existentes, comprobar salud y origen/fixture antes de declararlos disponibles; no tocar configuración o archivos del backend desde Admin.

Pendientes comunes: filtros/DTOs de lectura/validaciones precisas de documentos y reintento multipart ambiguo en propuesta parcial; atribución provincial de contingencia sin lugar aún abierta. Carga con lugar null se conserva por acuerdo; implementación backend B-04 pendiente. Fallback sin Web Locks/BroadcastChannel y logout offline/recarga requieren ratificación específica.

## Comprobación directa del entorno Admin

2026-11-05 (reverificado tras reanudación): `curl --max-time 3 -sS -i http://localhost:3000/health` y `http://localhost:5173/` devolvieron exit7 conexión rechazada (ningún servicio accesible desde este entorno en esos puertos). `docker ps --format '{{.Names}} {{.Ports}}'` devolvió permiso denegado al socket Docker; no se verificó inventario mediante ese comando. No se arrancaron servicios ni se migró/sembró backend. Esto limita certificación actual del navegador contra API real; se pueden iniciar Vite y pruebas locales cuando corresponda, pero no reemplazan backend/correo/fixture faltantes.

## Medida visual pendiente

Se intentó reverificar el área desktop de enlaces F-017 el2026-11-05 con preview mock propio en127.0.0.1:5175 (no5173 del usuario). Sandbox bloqueó escucha; ejecución local autorizada inició Vite. CUA encontró Chrome, pero IAB no estaba disponible y la API documentada de navegación/cierre devolvió error de timeoutMs ausente antes de navegar. Se crearon dos pestañas propias about:blank, sin interacción con pestañas del usuario; quedan bajo limpieza automática efímera del navegador. No se tomó una medida ni se afirma browser QA. Vite propio detenido (sesión74782, exit130); servidor5173 intacto. Evidencia local del mínimo36px continúa siendo CSS compilado y review independiente.
