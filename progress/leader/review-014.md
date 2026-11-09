# Despacho reviewer — F-014 y heredadas

Repo admin_web_app exclusivamente; rol .agents/agents/reviewer.md, AGENTS y skills locales. Revisar docs/tasks/014-transporte-sesion-http.md y plan con progreso progress/implementer/current.md, contrato Sesión web admin y docs integración/diseño/spec. Cuando entrega F-014 esté disponible, verificar criterios uno por uno y código real, sin ratificar fallback/logout offline ni nuevos DTOs.

En particular: prefijo, CSRF preauth/sesión, Bearer sólo memoria, bootstrap anónimo, single-flight tab/cross-tab, 401 no repetir refresh ni auth OTP, expiración, generación local/logout y respuestas tardías, cancelación/Query clear y errores. Coordinador no puede usar espera temporal como evidencia de que todas las pestañas recibieron nuevo access; tabs suspendidas no deben rotar cadena con token viejo. No certificar navegador/cookies por jsdom. Diferenciar defectos locales de bloqueo real stack/fixture/bandeja/two-tabs según progress/leader/dependencias-integracion.md.

F-011/F-013 heredadas cerradas con revisión independiente; referencia vigente docs/diseno-frontend.md. No reabrirlas por certificación HTTP pendiente.

Escribir veredicto separado en Review de cada spec y progress/reviewer/current.md con pendientes exactos/evidencia fresca. No editar código/backlog/SYNCED/otros repos/Git ni subagentes. Verificaciones serializadas; no duplicar suites completas simultáneas con implementers (progress/leader/verificacion-coordinada.md). Devolver SOLO paths, veredictos, n_items, progress_file.
