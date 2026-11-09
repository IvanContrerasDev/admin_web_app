# F-017 — implementación A-04

Estado: blocked para cierre integral por proveedor/fixture/Android; corrección local de review implementada y verificada, pendiente de reviewer independiente. Sin autoaprobación.

Aplicada receiving-code-review: confirmado anchor provincial inline sin mínimo y fuera de la regla desktop a.inline-flex. Ahora cada enlace es inline-flex con min-height/min-width de 2.25rem (36 px a fuente base 16), padding horizontal y foco con separación. Tailwind vigente usa --spacing:0.25rem; no hay override de tamaño raíz. No se modifica ningún control de 44px ni destinos/período/filtros.

## Resultado final

- `src/types/records.ts`: enum propio IntervalReviewStatus (NONE/PENDING/APPROVED); MANUAL_LOADED sólo en registro; evento intervalId nullable, metadata escalar preservada.
- `src/features/records/records-page.tsx`, `records-filters.tsx`: entrada sin siteId consulta global; selector Todas; conserva provincia explícita, mes y condición.
- `src/features/dashboard/dashboard-metric-card.tsx`: article semántico con enlace global del contador principal y enlaces provinciales hermanos de al menos 36×36px; conservan mes/condición y alcance mostrado, sin provincia automática ni anchors anidados.
- `src/features/records/use-monthly-records.ts`: no reintenta errores no reintentables (410/400 de snapshot); restart descarta páginas y vuelve a página uno con filtros vigentes.
- `record-editor-form.tsx`, `record-detail-dialog.tsx`: alta/corrección/aprobación resetean matriz a primera página e invalidan dashboard; 409 conserva borrador/versión hasta recarga explícita.
- `src/mocks/records-handlers.ts`, `dashboard-handlers.ts`: intervalos manuales NONE según proveedor; evento conserva payload y recordId al eliminar su intervalo, con intervalId null. Métricas leen los mismos registros runtime del adaptador, sin compartir sesiones entre tests.
- Pruebas nuevas en `src/features/{records,dashboard}/*.test.ts(x)`; ampliaciones en `src/services/{records,dashboard}-service.test.ts`. `src/app/f013.test.tsx` se adaptó sólo en prueba de tarjeta a article y verifica destinos sin anidación (ampliación autorizada por `docs/diseno-frontend.md` (tarjetas con enlaces hermanos)).

## Decisiones y límites

Servicios HTTP de dominio ya envían rutas/params y expectedVersion acordados; no se alteró transporte de F-014 ni services.ts. Mock no simula endpoint de ingesta Android nuevo para aparentar certificación. Evidencia sólo lectura: backend `src/modules/attendance/attendance.service.ts:198` incrementa versión y revierte APPROVED a PENDING en la transacción del evento; no equivale a ejecutarlo con proveedor.

No se atribuye provincia ni lugar a contingencia null: ese mapping sigue abierto/B-04, de acuerdo con `progress/leader/dependencias-integracion.md`. Las referencias locales vigentes de matriz/detalle publican relaciones no null; cualquier nuevo DTO debe venir del proveedor ratificado.

## Verificación

Se aplicaron test-driven-development, systematic-debugging, verification-before-completion y react-best-practices: fallos reproducidos antes de corregir enums, nullable, enlaces, entrada global, snapshot retry, reset de páginas y métricas runtime. React: hooks estables, fetch metadata habilitado sólo bajo demanda, links accesibles hermanos, keys estables y controles existentes.

Verificación fresca de corrección: `npx vitest run src/features/dashboard src/app/f013.test.tsx --maxWorkers=2` exit 0, 34/34 casos (tres archivos). Typecheck y lint exit 0. `git diff --check -- src/features/dashboard/dashboard-metric-card.tsx` exit 0. Estructura y estilos verificados directamente: min-h-9/min-w-9, inline-flex, padding y foco; no se agregan tests de clases que dupliquen implementación.

Medición desktop real no ejecutada: inventario CUA sin apps/browsers disponibles y Python playwright ausente. No se instaló tooling ni se simuló medición por jsdom. Preview mock autorizado sólo para medida, sin afirmar API E2E.

La entrega funcional de dominio corroboró 55/55 casos y 84/84 incluyendo F-013; build exit 0 con warning existente de chunk >500 kB. npm ci compartido fue ejecutado por F-014. La suite global/build finales siguen a cargo de F-014 según coordinación; no se repitieron por una modificación de caja/foco sin cambio funcional. Los fallos previos de auth se derivaron a su owner y no se asumen vigentes ni resueltos desde esta corrección.

## Pendientes para leader/reviewer

- API/navegador/Android: falta endpoint operativo con cuenta opt-in/OTP y fixture compartido B-02/B-03; B-04 lugar null y Q-01 pendientes según archivo del leader. No se fabrica credencial ni se modifica backend. No se ejecutó navegador con mock como sustituto de API.
- Documentación canónica ya consolidada por leader; certificación integral permanece pendiente.
- Entrega local aprobada por reviewer independiente; no cerrar certificación cross-app por pruebas mock/jsdom.

Registro del spec actualizado. Slot de verificación libre; sin cambios fuera del dominio de tarjeta/estado/Registro en esta corrección.
