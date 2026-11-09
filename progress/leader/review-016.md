# Despacho reviewer — F-016

Rol reviewer local, repo exclusivo admin_web_app. Revisar docs/tasks/016-acceso-recuperacion-http.md y plan, Registro/progress/implementer-016/current.md, contrato común (Solicitud administrativa/Auth mobile/Sesión) y docs locales vigentes. No código/backlog/SYNCED/otros repos/Git ni subagentes.

Criterios: diez campos sin datos de UI extras; password existente1–128 puntos de código Unicode sin trim antes de OTP; reenvío sustituye challenge/cooldown, PENDING real sin sesión; recovery neutro; reset compartido /password-reset para ambas apps; enlace exacto /admin-access/confirm y GET sin mutación, POST explícito, sin exigirJWT al portador. Token sólo memoria/URL limpiada sin impedir navegación válida; errores401/409/410/422 con UX accesible. Cuenta existente no se sobrescribe ni se presume por respuesta previa a OTP. No inventar reenvío2FA login.

Correr verificaciones frescas serializadas maxWorkers2, declarar cada criterio y límites reales. API/correo/fixture en dependencias-integracion.md no se reemplazan por tests mock; diferenciar defectos locales de certificación integrada. Review en spec y progress/reviewer/current.md; devolver sólo task_spec, veredicto, n_items, progress_file.

Entrega disponible:263/263 tests,34archivos, typecheck/lint/build y npm ci offline exit0 por implementer; navegador mock observó reset/confirm sin submit, token URL limpiado. No certifica correo/DB/API. Ampliación mínima documentada en Registro: index.html referrer=no-referrer y wiring mocks; AuthService público con señal propia e invalidación local después de reset. Verificar sin reproducir cambios de password ni grants reales en navegador: sólo pruebas locales/mocks para esas acciones.

Foco UI por el defecto previo de A-04: comprobar área efectiva de links nuevos, incluido LoginLink en public-access-pages.tsx. Un min-height en anchor inline puede no producir caja mínima; contrastar CSS real y requisito desktop36px, sin tests que sólo reflejen clases. Si hay defecto, registrarlo junto a los demás ítems de una vez; no cambiar código desde reviewer.
