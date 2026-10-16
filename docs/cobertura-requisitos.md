# Cobertura de requisitos

Requisitos de las 95 secciones de [spec](spec_definition.md), con responsables funcionales y verificación prevista. No es historial ni resultado de tests. Las decisiones actuales y racional están en [diseño](diseno-frontend.md); acuerdos cross-app en [contratos](arquitectura/contratos-api.md).

Tipos de comprobación prevista: D documental, U unitaria, C componente, B navegador e I integración real. Ninguna etiqueta por sí sola acredita ejecución.

## Parte 1 — Visión y dominio

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-01 / §1 Introducción | F-001, F-010 | Admin se integra al ecosistema GdeS; backend conserva auth/negocio/storage; sin backend alternativo en web | D de arquitectura; I contra backend, no credenciales reales en fixtures |
| C-02 / §2 Objetivos | F-004–F-009, F-010 | Gestionar empleados, estructura, registros, planillas, legajos e Inicio; no omitir un módulo | B de recorridos CRUD permitidos y revisión operativa; contratos contratos comunes por tema por módulo |
| C-03 / §3 Diseño y UX | F-002–F-009 | Tema claro desktop-first; densidad legible, filtros durante sesión, edición rápida, feedback; no modo oscuro | C/B de filtros al navegar, acciones y foco; revisión visual sin ruido decorativo |
| C-04 / §4 Idioma | F-002–F-009 | UI española; código/campos en inglés; Site → Provincia, Workplace → Lugar de trabajo | U de labels y B de errores/estados, sin enums internos visibles |
| C-05 / §5 Roles | F-003, F-010 | ADMIN y SUPER_ADMIN mismas vistas; EMPLOYEE sin acceso web; TO_BE_ADMIN bloqueado web Y mobile según contrato vigente; sin gestión admin adicional | U/C de guards; I de roles actuales y mensaje pendiente; D de precedencia sobre spec antigua |
| C-06 / §6 Cuenta | F-004, F-010 | ACTIVE opera; INACTIVE bloquea login/marcaciones/ausencias/uploads; historial intacto y nunca borrar empleado | C de confirmación; I de bloqueo backend e historial; contrato Inactividad/historia para correcciones históricas |
| C-07 / §7 Identidad | F-003, F-004 | Email/legajo/DNI únicos, no fusionar cuentas ni sobrescribir existentes | U de formatos, I de los tres conflictos y concurrencia; contratos Solicitud/Validaciones |
| C-08 / §8 Relaciones | F-005, F-006 | Registro único usuario–lugar–fecha, muchos intervalos, sin asignación permanente empleado–lugar | U/I de múltiples lugares por día y duplicado rechazado; contratos Matriz/Registros |

## Parte 2 — Auth y empleados

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-09 / §9 Autenticación | F-003, F-010 | 9.1 email/password/recordar; 9.2 challenge email antes de sesión, seis dígitos/10 min/5 intentos según backend, resend acordado; 9.3 recuperación/reset administrativo por email, no gestión de password empleado | U/C errores; B login→2FA→sesión y reset token un uso/una hora; I rotación 30 min/7 días, rechazo y revocación; contrato Sesión web admin/contrato Catálogos |
| C-10 / §10 Solicitud admin | F-003, F-010 | 10.1 diez campos; 10.2 verificar email antes de crear usuario completo/cambiar rol, correos y aprobar ADMIN/rechazar EMPLOYEE; 10.3 mensaje pendiente y bloqueo mobile según contrato | C formulario/confirmación; I nueva/existente/duplicada/inactiva/conflictos; B enlace GET no decide, expirado/consumido; contrato Solicitud administrativa |
| C-11 / §11 Empleados | F-004, F-010 | 11.1 diez campos, habilitado sin email ni cambio password obligatorio, password solo al alta; 11.2 columnas y accesos perfil/planillas/legajo, búsqueda parcial cinco campos, apellido/nombre ASC; 11.3 editar sin rol; 11.4 activar/desactivar sin borrar historia | U/C validación; B listado/edición/confirmación; I unicidad/bloqueo y respuesta sin password/hash; contrato Clientes/lugares |

## Parte 3 — Registros

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-12 / §12 Registro diario | F-006 | Solo una entidad por usuario/lugar/fecha; distintos lugares mismo día válidos, varios intervalos | U/I unicidad incluida carrera crear sobre celda previamente vacía; contratos Matriz/Registros.A |
| C-13 / §13 Estructura | F-006 | Detalle muestra usuario, lugar, fecha, intervalos, minutos, completitud, revisión, origen y observación nullable | U de DTO/dominio; C detalle sin queries por cada relación; contrato Catálogos |
| C-14 / §14 Trabajo | F-006 | Sumar únicamente WORK cerrados; ABSENCE y WORK incompleto aportan cero; sin duración de ausencias | U ejemplos 09–12 + 13–18 = 480 min, ausencia 09–13 + trabajo 13–18 = 300; I backend deriva |
| C-15 / §15 Completitud | F-006 | Todos los intervalos completos → COMPLETE; cualquiera OPEN/SEMI_CLOSED → INCOMPLETE, excepción ausencia sin horas | U tabla de estados contrato Registros e I recalculado tras edición |
| C-16 / §16 Revisión registro | F-006 | NONE/PENDING/APPROVED/MANUAL_LOADED; GPS causa PENDING; no existe rechazo y una inconsistencia se corrige; aprobación pura conserva origen, datos e intervalos | U/C transición APPROVED y conflicto de versión; I separar revisión de corrección; contrato común de registros |
| C-17 / §17 Origen | F-006 | Todo automático → AUTOMATIC; algún intervalo manual → MANUAL; aprobar nunca cambia el origen; resolver observación general sin marcar arbitrariamente intervalos | U/I mezclas de origen y aprobación pura; contrato Registros |
| C-18 / §18 Intervalos | F-006 | Tipo/extremos/estado/revisión/origen/observaciones/metadata separados; ID persistido para editar o eliminar sin duplicar | U DTOs; C edición, DELETE y campos null; contrato Registros |
| C-19 / §19 WORK/ABSENCE | F-006 | Ausencia total/parcial/mixta; extremos opcionales; sin ambos CLOSED/COMPLETE/cero, un extremo incompleto | U siete casos contrato Registros; C formulario, no completar horas ficticias |
| C-20 / §20 Motivos | F-002, F-006 | Catálogo fijo Enfermedad/Vacaciones/Licencia/ART/Otros; Otros no obliga observación | U labels/enums y C formulario; contrato Registros sobre motivo null |
| C-21 / §21 Estado intervalo | F-006 | OPEN entrada sola, SEMI_CLOSED salida sola, CLOSED ambos o ABSENCE sin ambos | U/C tres estados y excepción ratificada; contrato Registros |
| C-22 / §22 Revisión intervalo | F-006 | NONE/PENDING/APPROVED y MANUAL_LOADED según contrato común, sin rechazo; independiente de completitud | U/C CLOSED + PENDING; no se agrega ruta separada de revisión por intervalo en este incremento |
| C-23 / §23 Proyección automática | F-006, F-010 | Entrada siempre agrega; salida cierra último abierto MISMO día, sin abierto crea salida sola; no copiar ejemplo contradictorio; no emparejar medianoche | U fixtures 09/11/12/18 y dos fechas GMT-3; I backend con eventos offline; admin solo consume proyección |
| C-24 / §24 Metadata | F-006 | Detalle expandible timestamp/lat/lon/accuracy/device/origin; null legible, evidencia original no editable | C expansión y ausencia metadata; I corrección no altera AttendanceEvent; contrato Catálogos |
| C-25 / §25 Edición | F-006 | Abrir celda por doble clic o alternativa accesible; editar individual, agregar/modificar/eliminar intervalos, crear registro completo; conflictos y cambios sin guardar | C/B teclado, formulario y cancelación; I unicidad/versión/validación; contrato común de registros |
| C-26 / §26 No borrar | F-006, F-010 | Sin eliminación de registros; la corrección puede eliminar intervalos declarados con DELETE y siempre conserva al menos uno | C acción deshabilitada para el último intervalo; I validación backend; contrato común de registros |
| C-27 / §27 Extensiones | F-001, F-010 | EXCLUIDO: vacaciones formales, aprobación de ausencias, métricas avanzadas, auditoría visible y reglas nuevas | D de alcance; conservar separación de modelos, no implementar UI futura |

## Parte 4 — Organización y mapa

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-28 / §28 Organización | F-005 | Site/Client/Workplace separados; etiquetas Provincia/Cliente/Lugar de trabajo | U relaciones y B nomenclatura |
| C-29 / §29 Provincias | F-002, F-004, F-005 | 29.1 empleado pertenece a una; 29.2 lugar a una, Site puede no tener lugares; seis provincias; UTC transporte/GMT-3 lógico según contrato, no enum inventado | U catálogo y fechas; C selects; I FK; contrato Catálogos |
| C-30 / §30 Clientes | F-005 | 30.1 ACTIVE/INACTIVE, sin borrar, no operaciones futuras inactivas; 30.2 cliente puede tener cero/muchos lugares de varias provincias | C gestión/confirmación; I historia y asociaciones; contrato Inactividad/historia |
| C-31 / §31 Lugares | F-005 | 31.1 cliente y provincia obligatorios; 31.2 activar/desactivar, bloquear futuro sin borrar registros/planillas | U/C requeridos; I inactividad y concurrencia; contrato Clientes/lugares |
| C-32 / §32 Alta lugar | F-005 | Elegir cliente/provincia, nombre, zona geográfica y guardar | B flujo completo, error y reintento seguro; contrato por dominio/contrato Mapas |
| C-33 / §33 Geografía | F-005, F-010 | CIRCLE únicamente; 33.1 buscar dirección/mover marcador; 33.2 radio metros/círculo; 33.3 umbral GPS opcional, PENDING derivado por backend | B mapa real y teclado, C null/error; I tolerancia/precisión; contrato Mapas proveedor y contrato por dominio límites |
| C-34 / §34 Payload lugar | F-005 | Enviar clientId/siteId/name/CIRCLE/lat/lon/radio/umbral en camelCase vigente, no labels ni objeto SDK | U request/response exacto y C edición; contrato Catálogos |
| C-35 / §35 Gestión | F-005 | Listar/crear/editar/activar/desactivar clientes y lugares; ver configuración geográfica | B ambos recursos y confirmaciones; no CRUD provincias |
| C-36 / §36 Filtros | F-005 | Búsqueda parcial de nombre; clientes por estado; lugares por cliente/provincia/estado | U query con todos filtros/sort y C reinicio de página; I no solo coincidencias locales |
| C-37 / §37 Futuro geográfico | F-001, F-010 | EXCLUIDO: polígonos, múltiples zonas, validaciones avanzadas y reglas por región | D alcance/mapa solo circular |

## Parte 5 — Archivos

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-38 / §38 Archivos | F-007, F-008 | 38.1 planilla soporte de carga manual, no OCR/registros automáticos; 38.2 legajo independiente, certificado sin vínculo técnico a ausencia | U modelos separados; I upload no modifica asistencia; D exclusión OCR |
| C-39 / §39 Planillas | F-007, F-010 | 39.1 múltiples empleado/lugar/mes/año, secuencia backend; 39.2 PENDING/LOADED/ERROR; 39.3 cargas mobile/admin, estado PENDING, campos obligatorios, siete formatos/20 MB; 39.4 columnas completas, año/mes/secuencia DESC, siete filtros y búsqueda parcial; 39.5 ver/cambiar estado/reemplazar con confirmación irreversible, no borrar planilla | U validación/orden; C/B carga/lote/preview/cancelar/reemplazar; I secuencia atómica, descarga expirada, borrado R2 anterior y estado ratificado; contrato Archivos |
| C-40 / §40 Legajo | F-008, F-010 | 40.1 ambas fuentes; 40.2 nueve tipos fijos, formatos/20 MB; 40.3 nombre/tipo/empleado/uploader/fechas, creación DESC, filtros empleado/tipo/fecha/uploader y búsqueda parcial; 40.4 editar nombre/tipo; 40.5 borrar con confirmación; 40.6 EXCLUIDO vencimientos/alertas/versionado/solicitudes/aprobaciones | U catálogos/archivos; C/B listar/editar/borrar/cancelar; I storage e historia de ambas fuentes; contrato Archivos |

## Parte 6 — Interfaz

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-41 / §41 Principios | F-002–F-009 | Trabajo rápido, resumen más detalle, consistencia y acciones explícitas | B recorridos frecuentes y revisión visual; no información ornamental |
| C-42 / §42 Plataforma | F-002–F-009 | Desktop-first; no garantía mobile/tablet en MVP; estructura no bloquea futuro responsive | B escritorio y scroll limitado; D exclusión adaptación completa |
| C-43 / §43 Terminología | F-002–F-009 | Español completo, incluidos errores, vacíos y dashboard como Inicio | C/B mensajes; U catálogo central sin enum visible |
| C-44 / §44 Colores | F-002, F-010 | Tokens base #0D80AE/#62882B/#ED701E/#0F172A/#EDF2F5, estados consistentes y accesibles | D tokens; B contraste/legibilidad y estado comunicado con texto además de color |
| C-45 / §45 Sidebar | F-003 | Persistente: Inicio, Registros, Usuarios, Clientes, Lugares de trabajo, Planillas, Documentos; naming ratificado por humano | B navegar desde todos módulos, ruta activa y deep links |
| C-46 / §46 Header | F-003 | Identidad/nombre app y logout; perfil propio opcional no contratado, EXCLUIDO edición propia nueva | C/B datos de sesión y cierre; contrato Sesión web admin |
| C-47 / §47 Inicio | F-009 | Cuatro métricas operativas: planillas pendientes, registros incompletos, revisión pendiente, registros con ABSENCE; no contar horas ni intervalos de ausencia | U/I conteos completos; C skeleton/empty/error; contrato Métricas período |
| C-48 / §48 Accesos métricas | F-009 | Enlaces llevan filtro y período coherentes; prevalecen sobre filtros de sesión previos | B cada contador→destino incluyendo ausencia; U serialización; contrato Matriz mensual/contrato Métricas |
| C-49 / §49 Tablas | F-004–F-008 | Densas/legibles, búsqueda/filtros/sort/paginación, acciones, loading/empty/error | C/B tablas con grandes conjuntos, orden backend y controles accesibles |
| C-50 / §50 Carga | F-002–F-009 | Skeleton refleja estructura, no aparentar datos incompletos como reales | C latencia inicial y B sin saltos/desbordes |
| C-51 / §51 Vacío | F-004–F-009 | Mensaje descriptivo y limpiar filtros/acción pertinente; no confundir falla de red con cero | C cero resultados, filtro y recuperación; B limpiar |
| C-52 / §52 Error | F-002–F-009 | Clasificación central: lecturas 429/500/502/503/504 backoff acotado; 400/401/403/404/422 no automático; 409/410 según backend | U reloj simulado/Retry-After; C error visible; I no retry ciego de writes/auth ambiguos |
| C-53 / §53 Toast | F-003–F-009 | Éxito/error de acciones puntuales; error de página en región propia, no toast único | C acción y error carga; B mensajes anunciados |
| C-54 / §54 Confirmaciones | F-004, F-005, F-007, F-008 | Explicar desactivar usuario/cliente/lugar, eliminar documento y reemplazar planilla; cancelar no muta | C/B aceptar/cancelar, foco restaurado; I no request antes de confirmar |
| C-55 / §55 Accesibilidad | F-002–F-009 | Contraste, tipografía, targets, foco/teclado, estados disabled/error y labels asociados | C roles/nombres/errores; B tabulación, diálogos y matriz accesible |
| C-56 / §56 Fuera de MVP | F-001, F-010 | EXCLUIDO dark mode, personalización UI, notificaciones realtime, alertas, analítica avanzada y adaptación completa mobile/tablet | D de dependencias, rutas y alcance |

## Parte 7 — Datos y seguridad

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-57 / §57 Objetivo técnico | F-002, F-010 | Configuración común de performance/datos/cache/errores/seguridad | D arquitectura y U políticas compartidas |
| C-58 / §58 Escala | F-006, F-010 | Cientos (<600) empleados, miles de registros/mes, múltiples lugares; no descargar universo ni optimización compleja prematura | B conjunto representativo; inspección requests/DOM y medición de carga/fluidez con entorno documentado |
| C-59 / §59 Server-driven | F-002, F-004–F-009 | Filtrar/sort/paginar/agregar/métricas en backend; mock reproduce límite del servicio | U adaptadores, I total fuera de página; contrato Matriz mensual evita reagrupar mes completo |
| C-60 / §60 React Query | F-002 | TanStack Query gestiona server state y mutations; no fetch directo en componente | D imports/arquitectura; U query client y hooks |
| C-61 / §61 Cache | F-002, F-004–F-009 | Mostrar cache y refrescar cuando corresponda, no borrar tabla durante refetch; limpieza al cambiar usuario | C cache→actualización; I/B separación sesiones |
| C-62 / §62 Invalidar | F-004–F-009 | Mutación registro invalida matriz/detalle/métricas; entidad invalida lista/detalle/dependientes; archivo invalida listado/firma relacionada | U mutation/query keys y C dato actualizado, sin invalidación global innecesaria |
| C-63 / §63 Query config | F-002 | refetchOnWindowFocus=false, refetchOnReconnect=true; sin polling | U focus/reconnect con reloj simulado; B requests esperadas |
| C-64 / §64 Tiempos cache | F-002, F-010 | Operativos cortos, catálogos mayores, refresh manual; staleTime/gcTime centralizados ajustables | U política por recurso; D valores documentados en tarea de implementación, no números inventados en F-001 |
| C-65 / §65 Páginas/filtros/sort | F-004–F-008 | Tradicional usuarios/clientes/lugares/planillas/docs; scroll dinámico solo registros; filtro/sort backend y páginas reiniciadas | U parámetros/cancelación; B listados y scroll; contrato Matriz mensual |
| C-66 / §66 Virtualización | F-006 | EXCLUIDA en MVP, período máximo un mes | D sin librería/uso virtualizador; B scroll del conjunto previsto |
| C-67 / §67 Loading | F-002–F-009 | Skeleton en métricas/tablas/forms/detalle; carga incremental no elimina filas anteriores | C inicio y página siguiente, sin EMPTY falso; contrato Matriz mensual |
| C-68 / §68 Empty | F-004–F-009 | Estados explícitos distintos de carga/error con sugerencia contextual | C/B vacío real, filtros y primera carga |
| C-69 / §69 Clasificación | F-002 | Centralizar códigos reintentables, combinar HTTP y contexto; no confiar solo en retryable | U combinaciones incoherentes y errores de red; backend 07 |
| C-70 / §70 Retry | F-002, F-010 | Lecturas temporales/timeouts con backoff acotado, loading y Retry-After; sin repetir mutaciones ambiguas | U timers/cancelación y C recuperación; I auth separado contrato Sesión web admin |
| C-71 / §71 No retry | F-002–F-009 | Request inválida, falta permiso/no encontrado/validación no se repiten automáticamente; 401 de OTP no inicia refresh | U códigos y C mensaje/manual cuando útil |
| C-72 / §72 Toast | F-003–F-009 | Solo acciones; errores de página dedicados (regla repetida se mantiene cubierta) | C éxito/error de mutation frente a query |
| C-73 / §73 Seguridad | F-003–F-008, F-010 | Frontend ayuda UX, backend valida auth/roles/integridad siempre; no secretos VITE ni tokens persistidos | D bundle/config/logs; I permisos e integridad al omitir UI; contrato Sesión web admin/contrato Solicitud administrativa |
| C-74 / §74 Auth frontend | F-003, F-010 | Access adjunto, expiración/renovación controlada, guard y logout sin loops; no sesión basada en decodificar JWT | U coordinación; B recarga/múltiples pestañas/carreras; I contrato Sesión web admin |
| C-75 / §75 Recordar | F-003, F-010 | Límite absoluto siete días; recordar cookie persistente, sin recordar cookie sesión; rotación no extiende infinito | I cookies sin mostrar secretos, expiración con reloj controlado; contrato Sesión web admin |
| C-76 / §76 Fechas | F-002, F-006–F-009 | Día/horas GMT-3, transporte UTC; fechas sin hora no sufren conversión local; sin selector multizona | U bordes UTC, medianoche, fin de mes/bisiesto en navegador zona distinta; contrato Registros |
| C-77 / §77 I18n | F-002–F-009 | Español único; EXCLUIDO multidioma; mensajes de API y labels españoles | U/B textos y formatos locales |
| C-78 / §78 Futuro técnico | F-001, F-010 | EXCLUIDO WebSockets, sincronización automática entre admins, virtualización, offline, refresh avanzado y telemetría permanente; pruebas de performance y coordinación auth no son esas features | D dependencias/config/alcance |

## Parte 8 — Contratos e implementación

| ID / sección | Feature responsable | Regla y criterio de aceptación | Evidencia / dependencia |
|---|---|---|---|
| C-79 / §79 Desacoplar backend | F-002, F-010 | Adaptadores mock/HTTP intercambiables, UI no depende de URL/envelope/librería HTTP; producción no cae a mocks silenciosamente | U mismos contratos; I switch explícito sin cambios de componentes |
| C-80 / §80 Arquitectura | F-002 | 80.1 api client transporte, services dominio/DTO, hooks Query datos/mutations, UI presentación | D dependencias y U tests por capa; sin llamadas directas desde UI |
| C-81 / §81 REST | F-002–F-008 | Usar verbos/rutas de contrato vigente, no escoger PUT/PATCH por sugerencia antigua; desactivar separado de borrar | U requests exactas; contratos comunes por tema para ampliaciones |
| C-82 / §82 Paginación | F-002, F-004–F-008 | page base 1/default25/máximo100 vigente, registros inicial50; envelope data/pagination, no items antiguo | U primera/última/vacía, límites y totales; contrato Matriz mensual mensual |
| C-83 / §83 Filtros URL | F-004–F-009 | Todos filtros/sort explícitos, query key completa, URL fuente de navegación, debounce y cancelación | U parse/serialize inválidos; B back/forward y enlace Inicio prevalece |
| C-84 / §84 Infinite | F-006 | useInfiniteQuery por fila completa empleado–lugar, agrega páginas al llegar final, sin botones de paginación ni duplicados | C/B dos páginas/error/reintento/fin/cambio filtros; contrato Matriz mensual snapshot/consistencia |
| C-85 / §85 Success | F-002 | data objeto o data[] con pagination vigente; no asumir envelope en 204 | U parse/transform respuestas y 204; contrato Matriz mensual meta conforme al contrato común |
| C-86 / §86 Error envelope | F-002 | error.code/message/retryable normalizado con status; códigos strings, español visible; HTTP+contexto decide retry | U JSON inválido/envelope/código desconocido y mensajes seguros |
| C-87 / §87 Validación | F-002–F-008 | Requeridos/email/password según política ratificada, archivos y campos; backend verifica de nuevo unicidad/permisos/negocio | U bordes/formats y C errores campo; I bypass frontend; contrato por dominio |
| C-88 / §88 DTO/domain | F-002 | DTO exacto de red separado de modelo UI, transformaciones tipadas; todo cambio consultado, no Prisma expuesto | U fixtures aprobados/typecheck; D contrato común distingue ratificado y pendiente |
| C-89 / §89 Enums | F-002 | Centralizar strings, incluir TO_BE_ADMIN/IntervalReviewStatus; Site entidad no enum; ausencia/documentos catálogo backend | U exhaustividad/labels/serialización, no valores numéricos accidentales |
| C-90 / §90 Formularios | F-002–F-008 | RHF+Zod con políticas del contrato común, componentes reutilizables y validación tipada | C errores/foco/sin doble submit, cancelación; U schemas |
| C-91 / §91 Componentes | F-002–F-009 | Inputs/select/fechas/files, tabla/badge/card, loading/empty/error, modal/confirm/toast/tooltip consistentes | C teclado/roles/estados; B usos reales, no catálogo decorativo |
| C-92 / §92 Estado | F-002, F-003 | Query para servidor; React local/context para UI/sesión; sin Redux ni duplicar cache server en store global | D arquitectura, U limpieza sesión; tema futuro excluido |
| C-93 / §93 Mocks primero | F-002–F-009, F-010 | Primero servicio mock contractual, después HTTP; fixtures explícitas deterministas aisladas, no auth mock presentada como real | U reset/latencia/error y mismos DTOs, I adaptador real; tipos candidatos requieren ratificación explícita |
| C-94 / §94 Testing | F-002–F-010 | Unitarios utilidades/mappers/validación, componentes críticos forms/matriz/edición, integración APIs/mutations/auth y navegador por incremento | Resultados build/lint/typecheck/tests y evidencia B/I en task specs; reviewer independiente antes de done |
| C-95 / §95 Evolución | F-001, F-002, F-010 | Separación permite nuevos roles/módulos/auditoría/realtime/volumen/tipos/estados; NO implementarlos ahora | D interfaces y ausencia de feature creep; mantener simplicidad MVP |

## Evidencia requerida

Los casos U/C/B/I describen verificaciones requeridas, no certifican ejecución ni disponibilidad real. Estado de implementación y límites en [diseño](diseno-frontend.md) e [integración](integracion.md); tareas activas en `docs/tasks/`. Los contratos comunes prevalecen en DTOs y acuerdos cross-app. Revisar las reglas completas y subsecciones de la spec, no solo esta matriz.
