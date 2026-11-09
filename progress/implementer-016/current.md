# F-016 / A-03 — estado actual

Implementación local entregada para revisión independiente. Status blocked sólo para criterios integrales de proveedor; sin pendientes de implementación local conocidos. No se modificaron Git, SYNCED ni otros repos.

## Implementado

- AccessService y tipos: diez campos exactos, challenge completo, verify PENDING, resend que sustituye challenge; recovery neutral, reset y confirmación POST.
- Registro consume /catalogs y envía password sin confirmPassword, conserva contraseña sin trim y acepta 1–128 puntos Unicode antes de OTP. Inputs de secretos sin maxLength UTF-16. Prueba UI con128 caracteres no BMP y cooldown real.
- Rutas públicas /password-recovery, /password-reset y /admin-access/confirm; GET sólo presenta, token únicamente en memoria y URL limpiada. Referrer=no-referrer en index.html antes de cargar recursos.
- AuthService: allowlist POST pública usa señal propia, independiente de bootstrap401; callback de reset confirmado invalida sesión local y notifica/limpia a través del provider existente. Sin rediseño de CSRF/coordinación.
- Mocks propios sólo simulan UI; no prueban envío de correo ni preservación de perfiles/password en DB.

## Ownership ampliado mínimo

Registrado antes de editar: invalidación local y señal pública en AuthService; index.html referrer para evitar filtrar query antes de React. Wiring en create-service-adapter.ts para mocks propios y services.ts para servicio nuevo.

## Verificación actual

- npm ci --offline --ignore-scripts --no-audit --no-fund: exit0,261 paquetes. Sin cambio de dependencias.
- npm run typecheck y npm run lint: exit0. Aplicada revisión de patrones React y guías UI locales; reloj inicializado de forma diferida, cancelación en desmontaje, labels/foco visible y feedback accesible.
- Suite completa: primera ejecución261/263, timeout5s en app.test.tsx y fallo consecuente de siguiente test; aislada app.test.tsx2/2 pasó sin modificar implementación. Reejecución completa sin navegador/Vite simultáneos:34 archivos/263 pruebas pasan (34.14s). npm run build exit0; warning principal579.84kB pendiente de F-010. git diff --check exit0.
- Navegador IAB contra Vite propio5174 mock: /password-reset?token=mock-token muestra formulario y limpia URL; /admin-access/confirm?token=mock-token&decision=REJECT muestra confirmación explícita sin decidir y limpia URL. No se cambió contraseña ni se confirmó decisión en navegador. Vite propio detenido y pestaña cerrada. Puerto5173 ya ocupado al iniciar; no se intervino ese proceso. Playwright Python no instalado; se usó navegador disponible.

## Bloqueo integral

`progress/leader/dependencias-integracion.md`: faltan endpoint API/correo local B-02 y fixture B-03/cuenta autorizada. No se prueba nuevo/existente, correos/aprobado/rechazado/vencido/replay o preservación de perfil/password contra DB mediante mocks. No se fabricaron credenciales, enviaron correos reales ni mutó backend. Revisión local puede realizarse separada de este bloqueo.

## Resultado final

Archivos propios nuevos: src/types/access.ts, src/services/access-service.ts, src/services/access-service.test.ts, src/services/access-mock.test.ts, src/mocks/access-handlers.ts, src/features/auth/access-ui.tsx, src/features/auth/registration-challenge.tsx, src/features/auth/public-access-pages.tsx, src/features/auth/public-access.test.tsx.

Archivos modificados: src/services/auth-service.ts, src/services/services.ts, src/services/create-service-adapter.ts, src/features/auth/registration-schema.ts, src/features/auth/registration-form.tsx, src/features/auth/registration.test.tsx, src/features/auth/login-page.tsx (sólo enlace recovery), src/app/router.tsx, index.html y Registro de implementación de docs/tasks/016-acceso-recuperacion-http.md.

Registro de spec completado; criterios locales1–4 y checks6 cumplidos con limitaciones expresas. Criterio5 integral conserva bloqueo. Leader/reviewer deben revisar sin autoaprobación. Consolidación documental de referencias “registro sólo valida” corresponde al leader al cerrar revisión; no se altera backlog ni documentación compartida desde este worker.
