# Plan de implementación incremental — GdeS Admin Web App

## 1. Objetivo y estado inicial

Construir el MVP administrativo paso a paso, preservando todas las reglas de negocio y con revisión verificable al cerrar cada etapa. Este plan no autoriza implementar toda la aplicación de una sola vez.

**Estado verificado:** repositorio documental, sin aplicación ni `package.json`; `feature_list.json` vacío y sin tarea activa del leader. Existen la especificación completa, contratos sincronizados, convenciones, plantillas de tareas, skills y archivos de progreso. Se analizaron las ocho partes de la spec y los documentos de backend aportados; estos últimos describen el backend previsto, no prueban que esté desplegado o disponible.

**Hoja de ruta aprobada; copia persistida en F-001 (2026-09-17).** La sesión de planificación produjo únicamente este plan. La aprobación posterior habilita ejecutar F-001: documentación local, propuestas y backlog, sin código de producto, cambios sincronizados, backend ni configuración de servicios. Estado operativo en [task spec](001-acuerdos-y-ejecucion.md), [cobertura](001-acuerdos-y-ejecucion-cobertura.md) y `progress/leader/current.md`. Las etapas posteriores requieren su incremento revisable y no se inician automáticamente.

### Fuentes y precedencia

- `docs/spec_definition.md`: fuente funcional; todas sus reglas deben tener cobertura en tareas y pruebas, incluso las repetidas.
- `docs/arquitectura/contratos-api.md`: fuente de integración. Sus decisiones vigentes prevalecen sobre ejemplos históricos y sugerencias de la Parte 8.
- Adjuntos del backend `01` a `07`: arquitectura, modelo, contratos, seguridad, asistencia, integraciones y convenciones. Son referencias de solo lectura; no se importan directamente desde código.
- `docs/convenciones/*`, `docs/tasks/TEMPLATE.md`, `AGENTS.md` y `.agents/skills/`: reglas de ejecución y revisión.
- Todo archivo `SYNCED-FROM-TEMPLATE` permanece intacto. Los cambios se proponen en `docs/changes_proposals/`; el orchestrator los aprueba y propaga junto con la documentación del backend.
- Cualquier DTO nuevo, ampliación o modificación contractual exige consulta humana específica. Aprobar esta hoja de ruta no convierte propuestas de endpoints en contratos vigentes.

## 2. Decisiones ya confirmadas

1. **React + Vite + TypeScript**; no Next.js ni backend alternativo.
2. **Registros como matriz mensual:** filas empleado–lugar de trabajo y columnas por día.
3. **Proponer consulta mensual** que entregue filas completas y pagine por empleado–lugar, no por registros diarios sueltos.
4. **Solo actividad del mes:** mostrar combinaciones con al menos un registro del período. Crear una combinación nueva mediante «Crear registro»; no inventar asignaciones fijas ni ausencias para días vacíos.
5. **Sesión web:** proponer refresh en cookie HttpOnly emitida por backend y access token en memoria. Requiere contrato web, CORS, CSRF y coordinación de rotación.
6. **Solicitud administrativa:** conservar los diez campos y verificar identidad por email antes de tramitar cambios de rol. No crear cuentas incompletas ni sobrescribir cuentas existentes desde un formulario no verificado.
7. **Ausencia sin inicio ni fin:** `ABSENCE` con `CLOSED`, completa y cero minutos trabajados. Con un solo extremo, incompleta; no calcular duración de ausencia.
8. **Medianoche:** conservar separación por fecha GMT-3. Entrada del día anterior abierta y salida del siguiente sin entrada; sin emparejamiento automático entre días.

Las decisiones 3, 5, 6 y 7 requieren formalización contractual o de reglas del backend; no se simulan como capacidades reales ya disponibles.

## 3. Hallazgos y cierre de contratos

### Diferencias documentales ya resueltas

- API en inglés, interfaz en español; respuestas `{ data }` y `{ data, pagination }`, no los formatos históricos mobile.
- `TO_BE_ADMIN` es un rol explícito. Aunque la spec antigua permite su acceso mobile, el contrato vigente lo prohíbe; la web muestra el mensaje de solicitud pendiente y no altera esa regla.
- Timestamps transportados y persistidos en UTC; fecha del registro y visualización en GMT-3. No utilizar la zona horaria del navegador para decidir el día.
- Provincias como entidades `Site`, no un enum de provincias inventado. Catálogo inicial: San Juan, Mendoza, Catamarca, La Rioja, Salta y San Luis.
- Construcción automática: cada entrada crea intervalo; cada salida cierra el último abierto del mismo registro diario; sin abierto crea `SEMI_CLOSED`. El ejemplo contradictorio del §23 no reemplaza la regla vigente del backend.
- Correcciones administrativas afectan la proyección y no crean ni modifican eventos de marcación originales.
- Archivos: 20 MB por archivo y hasta 10 archivos por request, según backend. Almacenamiento R2 a través de la API; no almacenamiento nuevo en esta web.
- `cuil`, `hireDate`, `position` quedan nullable; no convertirlos en obligatorios ni decidir quién los carga.

### Propuestas y acuerdos técnicos previos a las funcionalidades afectadas

**P-01 — Consulta de matriz mensual**

Documentar para revisión humana el endpoint y sus tipos exactos, manteniendo `/records` actual hasta aprobación. El diseño debe asegurar:

- Un único mes/año; filtros de provincia, empleado, lugar, cliente, completitud, revisión, origen y presencia de ausencia.
- Paginación estable por combinación empleado–lugar, con `pageSize` inicial 50 y límite acordado; todas las fechas de cada fila incluidas sin fragmentarlas entre páginas.
- Identificadores, nombres necesarios, registros por día, resúmenes, total de filas y metadatos de paginación sin consultas N+1 desde la UI.
- Diferenciar día sin registro de registro excluido por filtros y de datos aún no recibidos. Definir si los filtros seleccionan filas por coincidencia y qué días se incluyen; no ocultar registros existentes de forma que la UI permita crear duplicados.
- Semántica de totales mensuales y filtrados, orden estable con desempate y comportamiento tras cambios que alteren el conjunto paginado.
- No descargar todo el mes de registros diarios para reconstruirlo en el navegador. No identificar como vacía una celda de una fila parcialmente recibida.

**P-02 — Sesión web segura**

Precisar cambios para login/2FA, refresh, logout, restauración del usuario autenticado y «Recordar sesión», sin romper el transporte mobile:

- Refresh solo en cookie HttpOnly/Secure del backend; access en memoria, nunca tokens persistidos en localStorage/sessionStorage.
- Restaurar sesión mediante endpoint y respuesta aprobados, no decodificando un JWT como prueba de autorización.
- Con recordar sesión: cookie persistente hasta el límite absoluto de siete días. Sin recordar: cookie de sesión; backend continúa aplicando expiración. Las rotaciones no deben extender indefinidamente el límite aprobado.
- Acordar atributos SameSite, Path y dominio según orígenes reales, entornos de preview y restricciones de cookies de terceros; preferir producción same-site. No asumir que HttpOnly funciona dentro de cualquier iframe.
- CORS con orígenes explícitos y credenciales; defensa CSRF verificable en endpoints que usan cookie, validación de origen y mecanismo acordado con backend.
- Renovación única por pestaña y exclusión entre pestañas antes de rotar; intercambio seguro del resultado, cancelación al cerrar sesión y pruebas de carreras. El backend mantiene detección de reuso; el frontend no debe dispararla por solicitudes simultáneas legítimas.
- Logout revoca el refresh correcto, elimina la cookie y limpia caché/estado. Especificar qué hacer cuando no hay conectividad, sin prometer revocación remota exitosa.
- No reintentar ciegamente un refresh cuya respuesta se perdió: definir recuperación con backend para evitar reuso involuntario.

**P-03 — Solicitud administrativa completa y verificada**

Proponer request, respuestas y pasos con los diez campos de la spec, no enviar solo email y descartar el resto:

- Verificación de identidad por email antes de modificar rol o habilitar aprobación. Definir challenge, verificación, expiración, reenvío e intentos.
- Diferenciar alta nueva de cuenta existente. En existentes preservar datos y contraseña, comprobar identidad y tratar conflictos de email/DNI/legajo sin fusionar cuentas automáticamente.
- Prohibir degradación de ADMIN/SUPER_ADMIN o reactivación de INACTIVE por solicitud pública. Resolver solicitudes duplicadas y mantener respuestas que no revelen información innecesaria.
- Precisar cuándo se crea una cuenta completa, cuándo pasa a `TO_BE_ADMIN` y cuándo salen los correos al solicitante/SuperAdmin.
- Aprobar → ADMIN; rechazar → EMPLOYEE. Página `/admin-access/confirm?token=...&decision=...` con confirmación explícita antes de POST; nunca ejecutar la decisión al abrir el enlace. Manejar token inválido, vencido o consumido.
- No reutilizar sin acuerdo el endpoint de verificación mobile que redirige a un deep link.

**P-04 — DTOs, validaciones y operaciones pendientes**

Antes de implementar cada servicio afectado, cerrar ejemplos JSON y tipos exactos de requests/responses, nullables y errores:

- Creación/edición de registros: identidad de intervalos existentes/nuevos, campos editables, horarios válidos, límites por día, solapamientos, completitud requerida para alta manual, conflictos de unicidad y política de modificación concurrente. No añadir borrado de intervalos persistidos sin decisión expresa.
- Diferenciar revisión pura de modificación de datos: transiciones de revisión, efecto sobre origen y `MANUAL_LOADED`; precisar edición de observaciones y revisión por intervalo, cuyo mecanismo de escritura no está detallado.
- Formalizar excepción de ausencia sin horas y casos de un solo extremo; conservar separación diaria y derivación de totales en backend.
- Respuestas de listados/detalles con nombres y relaciones necesarios, filtros/sort permitidos y errores. `/workplaces` tiene formas diferentes para EMPLOYEE y ADMIN: tipar la forma administrativa correctamente.
- Búsqueda parcial de planillas/documentos exigida en spec, pero sin parámetro textual definido en sus endpoints; acordar campos y query. No aplicar una búsqueda incompleta solo sobre la página cargada.
- Campo `employeeId` del multipart de planillas administrativas, respuesta de uploads, resultado parcial/atómico de múltiples archivos, sustitución de archivo y efecto sobre estado de planilla.
- Permisos sobre empleados/clientes/lugares inactivos: impedir operaciones futuras, preservar consulta y corrección histórica, sin inventar desactivación en cascada ni borrar historia.
- Política exacta de contraseñas compartida con mobile; no inventar un mínimo. Reenvío 2FA admin, expiración, intentos y compatibilidad del endpoint de reenvío.
- Catálogos disponibles para formularios públicos y mecanismo de acceso sin sesión.

**P-05 — Mapa y búsqueda de direcciones**

La spec exige mapa, búsqueda de dirección, marcador movible y círculo; falta proveedor de cartografía/geocodificación. Elegir y confirmar proveedor, cuota, atribución, condiciones de uso, acceso desde navegador/backend y configuración antes de integración. Mantener servicio desacoplado con resultados mock explícitos; no sustituir el mapa por campos de coordenadas ni prometer un geocodificador público ilimitado.

**Regla de bloqueo:** estas cuestiones no requieren inventar respuestas para cerrar la hoja de ruta. Son entregables de cierre contractual. Solo bloquean el servicio o módulo dependiente; la base técnica puede avanzar. Mocks contractuales se implementan después de aprobar los tipos. Prototipos pendientes se etiquetan como tales y no se presentan como integración válida.

## 4. Arquitectura recomendada

### Stack

- Vite + React + TypeScript estricto.
- React Router para rutas, navegación y parámetros de consulta.
- TanStack Query para datos de servidor, caché, mutations e infinite scroll.
- React Hook Form + Zod para formularios y validaciones aprobadas.
- Tailwind CSS con componentes accesibles reutilizables; conservar identidad de la spec.
- Fetch nativo encapsulado, sin llamadas HTTP directamente en componentes.
- Vitest + React Testing Library para unitarios/componentes y Playwright para flujos.
- Librería de mapa cargada de forma diferida después de seleccionar proveedor.

No agregar Redux, otro backend, base de datos, autenticación SaaS, SDK R2 o servicio de email en este repositorio. NestJS/PostgreSQL, email y R2 son responsabilidades del backend existente/proyectado. No se necesita Neon, Supabase ni Blob para implementar el frontend.

### Estructura prevista

```text
src/
  app/             router, providers, QueryClient, bootstrap
  api/             client, endpoints, errors, session transport
  services/        auth, users, records, clients, workplaces,
                   catalogs, timesheets, documents, dashboard, geocoding
  hooks/
    queries/       query keys, listados, detalles, infinite queries
    mutations/     escrituras e invalidaciones
  types/           DTOs aprobados y modelos de dominio separados
  constants/       enums, labels/fallbacks aprobados, políticas
  mocks/           fixtures deterministas y adaptadores de servicio
  features/        auth, users, workplaces, records, timesheets,
                   documents, dashboard
  components/      layout, formularios, tablas, estados y confirmaciones
  lib/             fechas GMT-3, archivos, validadores y utilidades
  styles/          tokens visuales y estilos globales
  test/            setup y helpers
 e2e/              flujos completos
```

Flujo obligatorio: **UI → hooks de Query → servicios → adaptador mock o HTTP**. Los modelos de persistencia del backend no se copian como si fueran DTOs públicos. Estados/enums en inglés centralizados, labels españoles; nunca serializar enums numéricos por accidente.

### Datos, caché y errores

- Filtrado, orden, agregación y paginación en el servicio/backend. El mock replica ese límite, no deja lógica de datos masivos en la UI.
- Query keys incluyen todos los filtros y sesión; limpiar datos al salir o cambiar de usuario. Filtros en URL, conservados durante la sesión por módulo; enlaces del dashboard tienen precedencia sobre filtros guardados.
- Búsqueda con debounce, cancelar solicitudes obsoletas y reiniciar páginas al cambiar filtros. No borrar el conjunto visible en refetch; distinguir carga inicial y actualización.
- `refetchOnWindowFocus=false`, `refetchOnReconnect=true`, sin polling ni caché offline. Tiempos cortos operativos y mayores para catálogos, centralizados y ajustables.
- Reintentos acotados con backoff para lecturas y fallos transitorios: 429/500/502/503/504, timeouts/red según clasificación. Respetar Retry-After. Sin reintento automático de 400/401/403/404/409/410/422.
- La recuperación de un access expirado es un flujo de sesión controlado, no un retry genérico de credenciales u OTP inválidos. Evitar loops.
- No reintentar automáticamente escrituras no idempotentes, uploads, códigos de auth o decisiones ante respuestas ambiguas; evitar duplicados y consumo de intentos.
- Skeleton estructural inicial; error de página inline y reintento cuando proceda; empty state con limpiar filtros; toasts solo para acciones. Confirmación explícita de acciones destructivas.
- Invalidaciones específicas: registro → matriz/detalle/métricas; planilla → listado/URL de archivo/métrica; documento → listado/detalle/archivo; entidades → listados/detalles/selectores/dependientes.

### UX transversal

Español, desktop-first, tema claro. Sidebar persistente con Inicio, Registros, Usuarios, Lugares de trabajo, Planillas y Legajos. Clientes dentro de Lugares de trabajo; provincias como catálogo, sin gestión de altas. Header con identidad y cerrar sesión, sin inventar edición de perfil propio no contratada.

Tokens: primary `#0D80AE`, secondary `#62882B`, accent `#ED701E`, foreground `#0F172A`, muted `#EDF2F5`; variantes accesibles para texto/estados cuando haga falta. Tablas densas, filtros visibles, acciones explícitas, tipografía legible y horas alineadas. Estado mediante texto/icono además de color. Navegación por teclado, foco visible/restaurado, labels y errores asociados, diálogos accesibles. Doble clic en matriz con alternativa de teclado/botón. Scroll horizontal limitado a la matriz, no a toda la aplicación.

## 5. Etapas y criterios de aceptación

Cada etapa es un incremento revisable. El leader la convierte en una feature con task spec antes de ejecutarla; no se dividen artificialmente componentes de una misma pantalla en tareas inconexas.

### F-001 — Formalizar acuerdos y organizar la ejecución

**Archivos:** plan local de implementación, `feature_list.json`, `docs/tasks/001-...md`, propuestas en `docs/changes_proposals/`, `progress/leader/current.md`.

- Persistir la hoja de ruta aprobada, decisiones y matriz de cobertura de §§1–95.
- Redactar P-01 a P-05 con discrepancia, propuesta, ejemplos, impacto por app, preguntas restantes y criterio de desbloqueo.
- Registrar features y dependencias sin marcar como resuelto un contrato pendiente. El leader sigue siendo el único que cambia estados.
- Documentar los ajustes funcionales aprobados en docs locales con trazabilidad; no tocar archivos sincronizados ni los adjuntos.

**Aceptación:** cada hueco tiene responsable, módulos afectados y evidencia requerida; cada sección de la spec está asignada a una tarea/prueba o exclusión expresa. Ningún contrato se implementa silenciosamente. La base técnica queda desbloqueada aunque backend aún deba responder.

### F-002 — Base técnica, servicios y entorno de pruebas

**Depende de:** organización de F-001; tipos aprobados para servicios concretos.

**Archivos:** `package.json`, lockfile, `index.html`, configuración Vite/TS/lint/tests, `src/app`, `src/api`, `src/services`, `src/types`, `src/hooks`, `src/mocks`, `src/lib`, estilos base.

- Crear SPA, scripts de desarrollo/build/lint/typecheck/test y estructura prevista.
- Configuración explícita mock/HTTP; una configuración de producción inválida nunca cae silenciosamente a mocks.
- Implementar primero servicios mock aprobados, fixtures deterministas y helpers de reset. Latencia/errores inyectables para pruebas, sin credenciales reales.
- QueryClient, errores normalizados, cancelación, envelopes y consultas paginadas base.
- Utilidades UTC/GMT-3, fechas sin hora y validación de archivos. Separar estado mock por instancia de test/sesión; limpiar al terminar.

**Aceptación:** build, lint, typecheck y tests básicos pasan; cambiar adaptador no obliga a modificar componentes; fixtures y DTOs validados; no secretos en variables `VITE_*` ni tokens en almacenamiento persistente.

### F-003 — Autenticación y navegación administrativa

**Depende de:** F-002; P-02/P-03 y detalles 2FA/catálogos públicos aprobados para sus partes correspondientes.

**Archivos:** `src/features/auth`, `src/services/auth*`, transporte de sesión, rutas/guards y layout compartido.

- Login email/contraseña/recordar sesión; enviar `identifier` y `client=ADMIN` conforme contrato.
- Login 202 inicia challenge, no sesión; código email de seis dígitos, expiración de diez minutos y máximo cinco intentos definidos por backend. Reenvío según acuerdo, cooldown visible.
- Admitir ADMIN/SUPER_ADMIN con mismas vistas. Rechazar EMPLOYEE/INACTIVE; mensaje exacto para TO_BE_ADMIN: «Su solicitud de acceso administrativo se encuentra pendiente de aprobación.»
- Recuperación y reset por email para flujo administrativo, respuesta neutra, token de un uso/una hora y errores de expiración. No permitir al admin revisar o recuperar contraseñas de empleados.
- Solicitud completa, verificación y confirmación de decisión del SuperAdmin conforme P-03. Links sensibles sin ejecución automática, sin logs/analítica de tokens.
- Bootstrap de sesión, guard sin destello de contenido protegido, retorno a destino interno validado, refresh/logout coordinados y limpieza de caché.
- Sidebar/header y rutas con lazy loading; fallback de SPA/deep links previsto para hosting.

**Aceptación:** flujos felices y errores verificables con mocks; no acceso por manipular estado local; no tokens antes de 2FA; recarga, expiración, logout y carreras de pestañas cubiertas. La simulación no se presenta como validación de cookies reales; esa evidencia corresponde a F-010.

### F-004 — Gestión de empleados

**Depende de:** F-003 y DTOs/catálogos/política de contraseñas aprobados.

**Archivos:** `src/features/users`, servicio users, queries/mutations y validadores.

- Tabla paginada: nombre completo, legajo, DNI, email, teléfono, provincia, estado y accesos al perfil/planillas/legajo.
- Búsqueda parcial por nombre/apellido/email/legajo/DNI; filtro estado; orden apellido y nombre ascendente, ejecutados por servicio.
- Alta con diez campos obligatorios y contraseña inicial. Unicidad global email/DNI/legajo: validar formato local y mostrar conflictos del backend por campo.
- Alta habilitada inmediatamente, sin verificación de email ni cambio de contraseña obligatorio. Contraseña no revisualizable ni guardada tras éxito.
- Editar datos permitidos sin rol ni contraseñas; activar/desactivar con confirmación e historia intacta. Nullable del perfil no se convierte en nuevo requisito.

**Aceptación:** duplicados, validaciones, paginación, búsqueda, edición, desactivación y deep links probados; nunca ofrecer eliminar empleado o administrar roles. No afirmar que una cuenta quedó bloqueada en backend solo por ocultarla en UI.

### F-005 — Clientes, provincias y lugares de trabajo

**Depende de:** F-003/F-004 para patrones compartidos; P-05 y contrato de inactivos.

**Archivos:** `src/features/workplaces`, servicios clients/workplaces/catalogs/geocoding, componente de mapa lazy.

- Clientes: listar, buscar parcialmente por nombre, filtrar estado, crear/editar/activar/desactivar; pueden existir sin lugares.
- Provincias: catálogo consultable, puede contener provincias sin lugares; sin altas en MVP.
- Lugares: tabla paginada y filtros nombre/cliente/provincia/estado; pertenencia obligatoria a un cliente y provincia.
- Formulario con nombre, mapa/búsqueda de dirección, marcador movible, círculo, radio en metros y umbral GPS opcional. Coordenadas/radio consistentes; no geometrías adicionales.
- Desactivar sin eliminar registros/planillas históricos; no habilitar nuevas operaciones en entidades no operativas según backend.

**Aceptación:** persistencia de centro/radio/umbral, búsqueda de dirección y movimiento de marcador; errores del proveedor recuperables; estados e invalidaciones coherentes. GPS pendiente es una señal de backend, no un cálculo frontend que reescribe validaciones históricas.

### F-006 — Matriz mensual y edición/revisión de registros

**Depende de:** F-004/F-005, P-01 y reglas/DTOs de registros aprobados.

**Archivos:** `src/features/records`, servicio records, `useInfiniteQuery`, editor de intervalos, detalle de metadata y utilidades temporales.

- Mes/año único, filas empleado–lugar con actividad del mes, columnas reales de 28–31 días; identificación de cliente/provincia y filtros completos del contrato.
- Encabezado e identificación de fila fijos, scroll continuo vertical con páginas de filas completas, sin botones de paginación ni virtualización. Prevenir solicitudes duplicadas de siguiente página.
- Celdas con resumen de horas/estados/ausencia; detalle de intervalos bajo demanda. Totales oficiales del backend, no sumar solo las páginas cargadas como total global.
- Crear registro desde acción global para cualquier combinación válida; celda vacía habilita creación solo si su ausencia está confirmada. Concurrencia/duplicado lleva a recuperar el registro existente sin sobrescribirlo.
- Editor registro por registro: horarios, observaciones, agregar intervalos, WORK/ABSENCE, motivos y revisión según contrato. Sin borrado de registros ni edición masiva.
- Completitud, origen y revisión independientes: WORK cerrado suma minutos; ausencias nunca suman; un intervalo manual determina origen general manual; creación/edición administrativa marca MANUAL_LOADED; revisión pura según transición aprobada.
- Ausencia sin extremos CLOSED/cero trabajo; con uno OPEN o SEMI_CLOSED; «Otros» sin observación obligatoria. Sin duración estadística de ausencia.
- Rechazados visibles, destacados y editables; corrección y posterior aprobación permitidas.
- Metadata expandible de entrada/salida: hora oficial, coordenadas, precisión, dispositivo, origen, recepción y fix cuando API los exponga. Nunca inventar eventos para cargas manuales.
- Mantener fechas separadas al cruzar medianoche; explicar estado incompleto, sin unión ni reparto automático entre días.

**Aceptación:** múltiples intervalos/lugares, ambas ausencias, mixtos, sin actividad, estados independientes, fechas UTC cercanas al cambio GMT-3, meses bisiestos, filtrado y páginas completas. El fixture entrada 09, entrada 11, salida 12, salida 18 cierra 11–12 y 09–18 conforme regla vigente, no el ejemplo erróneo. Backend sigue siendo dueño de ingesta/proyección; el frontend no implementa el pipeline mobile.

### F-007 — Planillas

**Depende de:** F-004/F-005/F-006 y multipart/respuestas aprobados.

**Archivos:** `src/features/timesheets`, servicio timesheets, uploader/visor compartidos.

- Tabla con empleado, lugar, cliente, provincia, mes/año, secuencia, estado, fecha y autor de carga.
- Filtros completos y búsqueda parcial acordada; orden año, mes y secuencia descendentes; paginación tradicional.
- Carga por admin: empleado/lugar/mes/año/archivos requeridos, formatos permitidos, 20 MB por archivo y máximo 10 por request. Múltiples planillas por combinación; secuencia asignada por backend.
- Estado inicial PENDING; cambio a LOADED o ERROR y demás transiciones admitidas. LOADED significa procesada, no aprobación formal.
- Visualizar/descargar vía URL firmada de 15 minutos obtenida cuando se necesite; renovar si vence, no persistir como enlace permanente. PDF/imágenes cuando corresponda; descarga clara para formatos sin visor seguro.
- Reemplazo con confirmación de eliminación permanente del archivo anterior; invalidar enlace y datos. Sin botón de eliminar planilla.
- Ninguna carga genera registros, OCR o procesamiento automático. El admin carga registros por separado.

**Aceptación:** formatos/tamaños/cantidad, duplicidad legítima por período, secuencias, estados, fallos de subida y resultados parciales conforme contrato. Reemplazo y URL expirada cubiertos, sin afirmar borrado remoto hasta confirmación de backend.

### F-008 — Legajos digitales

**Depende de:** F-004/F-007 y contratos de documentos.

**Archivos:** `src/features/documents`, servicio documents, queries/mutations y componentes de archivo compartidos.

- Listado global y acceso desde empleado; nombre, tipo, empleado, autor, creación/actualización y formato disponible.
- Filtros empleado/tipo/fecha/autor y búsqueda parcial acordada, orden creación descendente, paginación tradicional.
- Carga por admin con empleado, tipo fijo y archivos; workplace opcional/null según contrato. Mismos límites de archivo que planillas.
- Tipos: DNI, certificado médico, contrato, ART, documentación EPP, ficha médica, normas internas, declaración de domicilio y otros.
- Renombrar nombre visible y cambiar tipo; ver/descargar vía URL firmada; eliminar documento y archivo con confirmación.
- No vincular técnicamente a ausencias/registros ni agregar vencimientos, versionado o aprobaciones.

**Aceptación:** documentos mobile/admin visibles, filtrado correcto, edición sin modificar identidad del archivo indebidamente y eliminación reflejada tras respuesta; confirmación cancelable, errores y límites probados.

### F-009 — Inicio operativo

**Depende de:** módulos operativos y contrato dashboard.

**Archivos:** `src/features/dashboard`, servicio dashboard y query de resumen.

- Cuatro métricas backend: planillas PENDING, registros INCOMPLETE, revisión PENDING y cantidad de registros con al menos una ABSENCE.
- No confundir registros con ausencia con número de intervalos ni con duración de ausencia.
- Accesos directos a listados/matriz con filtros y período/provincia coherentes. No inventar filtros que el endpoint no soporte.
- Skeleton, actualización manual, caché corta e invalidación tras mutaciones relevantes; sin dashboard analítico ni gráficos adicionales.

**Aceptación:** cifras sobre el conjunto completo, no sobre páginas visibles; enlaces abren filtros correctos; las cifras cambian después de modificaciones y los fallos no aparecen como ceros ficticios.

### F-010 — Integración real y validación del MVP

**Depende de:** contratos ratificados/propagados, backend disponible, orígenes y proveedor de mapa configurados, F-002 a F-009 revisadas.

**Archivos:** adaptadores HTTP, configuración de entorno/hosting, pruebas contractuales/E2E y documentación de verificación.

- Sustituir adaptadores por dominio sin cambiar UI/hooks; comparar respuestas reales con DTOs/fixtures aprobados. No activar fallback mock por fallo de API.
- Verificar 2FA/correos, cookies HttpOnly y CORS/CSRF, recordar sesión, recarga, expiración absoluta, refresh concurrente, logout y permisos reales.
- Probar permisos y validaciones backend con cuentas de prueba, no datos personales/productivos.
- Subir archivos reales por backend, descargar URLs firmadas, verificar reemplazo/eliminación y límites. La configuración de R2/email pertenece a backend.
- Verificar búsqueda cartográfica con cuota/atribución; no exponer secretos en bundle.
- Medir matriz de un mes con volumen representativo de menos de 600 empleados, miles de registros y múltiples lugares por empleado. Inspeccionar requests, memoria, tamaño de carga, filas incompletas, scroll y cancelación; no cambiar a virtualización sin aprobación.
- Build de producción, typecheck, lint, tests unitarios/componentes y E2E. Probar recarga directa y deep links de login/reset/confirmación en hosting SPA, distinguiendo rutas de assets/API.
- Revisión de accesibilidad, teclado, foco, contraste, errores, ausencia de logs sensibles/debug y limpieza de caché entre usuarios.

**Aceptación:** flujos críticos ejecutados contra backend de prueba con evidencia; sin contratos pendientes ocultos, controles decorativos, mocks activos involuntariamente ni operaciones prohibidas. El despliegue y las mutaciones Git requieren autorización separada.

## 6. Matriz de cobertura y pruebas

| Spec | Cobertura principal | Comprobación |
|---|---|---|
| Parte 1, §§1–8 | F-001, F-003–F-006 | Roles, inactivos, identidad única, relaciones e historia |
| Parte 2, §§9–11 | F-003, F-004, F-010 | 2FA, sesión, solicitud, empleados y seguridad |
| Parte 3, §§12–27 | F-006 | Unicidad diaria, intervalos, ausencias, revisión, metadata y no borrado |
| Parte 4, §§28–37 | F-005 | Cliente/provincia obligatorios, mapa circular e inactivos |
| Parte 5, §§38–40 | F-007, F-008 | Límites, secuencias, estados, sustitución/eliminación y separación documental |
| Parte 6, §§41–56 | F-002–F-009 | Navegación, idioma, tablas, dashboard, feedback y accesibilidad |
| Parte 7, §§57–78 | F-002, F-003, F-006, F-010 | Caché, servidor como autoridad, errores, sesión, GMT-3 y volumen |
| Parte 8, §§79–95 | F-001, F-002, F-010 y cada módulo | Contratos aprobados, servicios/mocks, Query, forms y pruebas |

F-001 expande esta matriz a criterios por sección, sin cambiar sus reglas. En cada entrega se verifican: flujo feliz, permisos, validaciones, carga, vacío, error, reintento aplicable, cancelación, invalidación y operación destructiva si existe.

Casos transversales obligatorios: fechas iguales en navegadores con distintas zonas horarias; meses de 28/29/30/31 días; alta manual contra duplicado concurrente; filtro sin resultados; error al cargar página siguiente sin perder anteriores; respuesta perdida de una escritura sin duplicación automática; sesión vencida con formulario abierto; cambio de usuario sin datos del anterior; URL firmada vencida; límite de 10/11 archivos y de tamaño exacto según bytes acordados.

## 7. Ejecución, revisión y límites

- Empezar por **F-001**, no por generar pantallas. Después, avanzar una feature revisable a la vez.
- Leader: task spec desde plantilla, criterios, dependencias, contratos y estado de backlog. Implementer: feature acotada y progreso mientras trabaja. Reviewer: verifica criterios/docs/contratos sin editar implementación. Leader cierra tras revisión; no confundir tests propios con aprobación independiente.
- Si aparece una contradicción no resuelta, registrar bloqueo y consultar antes de codificar ese comportamiento. No crear contratos nuevos dentro de mocks para eludir aprobación.
- Registrar evidencia y archivos modificados, actualizar task/progreso y archivar según convenciones. No cambiar archivos sincronizados.
- No crear ramas, worktrees, commits, PRs, pushes ni despliegues por iniciativa del agente.

**Fuera de alcance MVP:** mobile, ingesta de asistencia/infraestructura del backend en este repo, gestión de administradores/roles desde UI, asignación fija empleado–lugar, borrado de registros/planillas, edición masiva, OCR, vinculación automática documento–ausencia, turnos nocturnos entre días, métricas de duración de ausencia, dashboard analítico, polígonos/múltiples zonas, realtime/notificaciones, virtualización, offline, modo oscuro, personalización y adaptación completa mobile/tablet; tampoco versionado/vencimiento/alertas de documentos ni vacaciones formales.

**Primer punto de revisión:** validar este plan y comenzar únicamente F-001. Las propuestas de contrato se presentan con tipos concretos para su aprobación específica antes de implementar los módulos dependientes.
