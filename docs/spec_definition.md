
# INSTRUCCIÓN PARA AGENT
Este documento contiene la especificación funcional y técnica completa para la GdeS Admin Web App (MVP). 
Debes tomar este documento como la VERDAD ABSOLUTA del proyecto. 
- No omitas ninguna regla de negocio, por más redundante que parezca.
- Utiliza los contratos de TypeScript provistos en la Parte 8 para las interfaces de tu código, o en caso de modificarlos/agregar/mejorarlos debes consultarlo conmigo específicamente y de manera obligatoria.
- Implementa primero la capa de servicios con los Mocks recomendados antes de conectar APIs reales si se te solicita construir componentes aislados.

---

# Documento de Especificación Funcional

# GdeS Admin Web App (MVP)

**Parte 1 — Visión general, objetivos, principios de diseño, usuarios, permisos, entidades y modelo de dominio**

**Parte 2 — Autenticación, gestión de usuarios, empleados y administradores**

**Parte 3 — Modelo completo de registros horarios, intervalos, ausencias y reglas de negocio**

**Parte 4 — Gestión de clientes, provincias (sites), lugares de trabajo y geolocalización**

**Parte 5 — Gestión de planillas y documentos de legajo**

**Parte 6 — Dashboard, vistas, navegación, UX y comportamiento de las pantallas**

**Parte 7 — Performance, manejo de datos, cache, errores, seguridad y decisiones técnicas para frontend**

**Parte 8 — Reglas de API, contratos esperados, modelos TypeScript sugeridos y consideraciones para implementación con React**

Cada sección tendrá:

* Objetivo funcional.  
* Reglas de negocio.  
* Flujos de usuario.  
* Estados y transiciones.  
* Restricciones.  
* Casos límite.  
* Decisiones tomadas.  
* Consideraciones para implementación.

---

# Parte 1 \- Visión general, objetivos, principios de diseño, usuarios, permisos, entidades y modelo de dominio

---

# **1\. Introducción**

La GdeS Admin Web App es una aplicación web administrativa desarrollada como parte del ecosistema GdeS, el cual también está compuesto por:

* Aplicación móvil utilizada por empleados.  
* APIs backend responsables de la lógica de negocio, almacenamiento de datos, autenticación y procesamiento.  
* Servicios externos como envío de emails, almacenamiento de archivos y futuras integraciones.

El objetivo de la aplicación administrativa es proporcionar una herramienta centralizada para el personal administrativo de la empresa (recursos humanos, gerentes y otros responsables) que permita gestionar, revisar y garantizar la calidad de la información generada por el sistema de registros laborales.

---

# **2\. Objetivos principales del MVP**

El MVP debe permitir a los administradores:

**Gestión operativa de registros**

* Visualizar registros horarios de empleados.  
* Detectar información incompleta o incorrecta.  
* Editar registros existentes.  
* Crear registros manuales cuando sea necesario.  
* Revisar registros con problemas de validación.  
* Garantizar la completitud y calidad de la información de asistencia.

---

**Gestión de empleados**

Permitir:

* Visualizar empleados.  
* Buscar empleados.  
* Crear empleados manualmente.  
* Modificar información de perfil.  
* Activar o desactivar cuentas de empleados.  
* Acceder a sus documentos de legajo.  
* Visualizar sus planillas asociadas.

---

**Gestión de estructura organizacional**

Administrar:

* Clientes.  
* Provincias (internamente llamadas `sites`).  
* Lugares de trabajo (`workplaces`).  
* Configuración geográfica de cada lugar de trabajo.

---

**Gestión documental**

Administrar:

* Planillas de horas subidas por empleados.  
* Estado de procesamiento de dichas planillas.  
* Documentos pertenecientes al legajo digital de los empleados.

---

**Supervisión operacional**

A través del dashboard visualizar:

* Planillas pendientes de procesamiento.  
* Registros incompletos.  
* Registros pendientes de revisión administrativa.  
* Cantidad de ausencias.

---

# **3\. Principios de diseño y UX**

La aplicación prioriza principalmente la eficiencia operativa.

El objetivo no es construir una interfaz visualmente compleja, sino una herramienta rápida, clara y efectiva para usuarios administrativos que la utilizarán diariamente.

Los principios de diseño son:

**Claridad**

La información debe poder escanearse rápidamente.

Ejemplo:

* Tablas con buena densidad de información.  
* Uso de colores y etiquetas de estado.  
* Acciones claramente visibles.

---

**Eficiencia**

Los administradores deben poder resolver tareas frecuentes con la menor cantidad posible de pasos.

Ejemplo:

* Edición rápida de registros.  
* Filtros persistentes durante la sesión.  
* Búsquedas rápidas.

---

**Simplicidad**

Se evitarán elementos visuales innecesarios:

* No habrá modo oscuro en el MVP.  
* No se priorizará responsive mobile.  
* La aplicación será desktop-first.

---

**Feedback claro**

El usuario siempre debe conocer el estado de una acción:

Ejemplos:

* Confirmación de edición exitosa.  
* Confirmación antes de eliminar documentos.  
* Mensajes claros cuando una operación falla.

---

# **4\. Idioma y nomenclatura**

Toda la interfaz visible al usuario estará en español.

Ejemplos:

En código y backend:

Site  
Workplace  
Employee  
Record

En interfaz:

Provincia  
Lugar de trabajo  
Empleado  
Registro

La terminología técnica en inglés se mantiene únicamente a nivel de desarrollo interno.

---

# **5\. Roles del sistema**

**Employee**

Empleado operativo que utiliza la aplicación móvil.

Puede:

* Registrar entradas y salidas.  
* Cargar ausencias.  
* Subir documentos a su legajo.  
* Subir planillas.

No tiene acceso a la Admin Web App.

---

**toBeAdmin**

Estado temporal de un empleado que solicitó permisos administrativos.

Comportamiento:

* En la aplicación móvil se comporta exactamente igual que un empleado.  
* No puede ingresar a la Admin Web App.  
* Al intentar iniciar sesión recibe un mensaje indicando que su cuenta se encuentra pendiente de aprobación administrativa.

---

**Admin**

Usuario con acceso a la Admin Web App.

Puede realizar todas las operaciones disponibles en el MVP:

* Gestión de empleados.  
* Gestión de registros.  
* Gestión de clientes y lugares de trabajo.  
* Gestión de documentos.  
* Gestión de planillas.

---

**SuperAdmin**

Existe conceptualmente en el sistema.

En el MVP:

* Utiliza la misma Admin Web App.  
* Tiene las mismas vistas que un administrador.  
* No posee funcionalidades adicionales implementadas en la interfaz.

Su responsabilidad actual está principalmente en procesos gestionados por backend, como la aprobación de solicitudes administrativas por email.

Futuras funcionalidades como administración de cuentas de administradores quedarán fuera del MVP.

---

# **6\. Estados de cuenta de usuarios**

**Empleados**

Los empleados poseen un estado de activación:

**ACTIVE**

Puede:

* Iniciar sesión en la aplicación móvil.  
* Registrar horarios.  
* Cargar ausencias.  
* Subir documentos.  
* Subir planillas.

---

**INACTIVE**

El empleado queda completamente bloqueado.

No puede:

* Iniciar sesión.  
* Registrar horarios.  
* Subir documentos.  
* Cargar ausencias.  
* Subir planillas.

No se elimina del sistema.

---

# **7\. Reglas de identidad de usuario**

Los siguientes campos son únicos en todo el sistema:

* Email.  
* Número de legajo (`employee_id`).  
* DNI.

No se permite crear usuarios duplicados.

Cuando se intenta crear un usuario con alguno de estos datos ya existentes, la operación es rechazada por el sistema.

---

# **8\. Modelo general de entidades y relaciones**

**Usuario ↔ Registro**

Un usuario puede tener múltiples registros.

Un registro pertenece a un único usuario.

Relación:

Usuario 1:N Registros

---

**Registro ↔ Lugar de trabajo**

Un registro siempre pertenece a un único lugar de trabajo.

Un lugar de trabajo puede contener múltiples registros.

Relación:

Lugar de trabajo 1:N Registros

---

**Registro ↔ Fecha**

Existe una restricción de unicidad:

(user\_id, workplace\_id, date)

Es decir:

Un empleado solamente puede tener un registro por día en un mismo lugar de trabajo.

Ese registro puede contener múltiples intervalos.

---

**Usuario ↔ Lugar de trabajo**

No existe una asignación fija.

Un empleado puede trabajar en distintos lugares.

Un lugar de trabajo puede tener distintos empleados.

La relación ocurre indirectamente mediante los registros horarios.

---

# Parte 2 — Autenticación, gestión de usuarios, empleados y administradores.

# **9\. Autenticación y seguridad**

La Admin Web App utiliza autenticación basada en JWT.

La arquitectura de autenticación se compone de:

* Access Token con duración de 30 minutos.  
* Refresh Token con duración de 7 días.  
* Refresh Token Rotation.  
* Persistencia de sesión mediante mecanismo "recordar sesión".

El usuario podrá mantener su sesión activa hasta el vencimiento del Refresh Token, realizando renovaciones automáticas del Access Token cuando sea necesario.

---

## 9.1 Inicio de sesión

Los usuarios administradores podrán acceder mediante:

* Email.  
* Contraseña.

La pantalla de login contará con:

* Campo email.  
* Campo contraseña.  
* Opción "Recordar sesión".  
* Enlace "Olvidé mi contraseña".

---

## 9.2 Doble factor de autenticación (2FA)

El acceso administrativo requerirá un segundo factor de autenticación mediante email.

Flujo esperado:

1. El usuario ingresa email y contraseña.  
2. El backend valida las credenciales.  
3. El sistema envía un código o enlace de validación al correo del usuario.  
4. El usuario confirma la autenticación.  
5. Se completa el inicio de sesión.

El mecanismo exacto de implementación queda definido por el backend, pero la Admin Web App deberá soportar el flujo de confirmación.

---

## 9.3 Recuperación de contraseña

Los administradores podrán recuperar su contraseña desde la Admin Web App mediante el flujo de "Olvidé mi contraseña".

El flujo general será:

1. El usuario ingresa su email.  
2. El sistema envía un correo de recuperación.  
3. El usuario accede al enlace recibido.  
4. Define una nueva contraseña.  
5. Puede volver a iniciar sesión.

---

Los empleados no recuperan sus contraseñas desde la Admin Web App.

La recuperación de contraseña del empleado se realiza exclusivamente desde la aplicación móvil mediante email.

---

# **10\. Registro de nuevos administradores**

Los administradores no son creados manualmente desde la Admin Web App en el MVP.

Un empleado existente puede solicitar acceso administrativo mediante un flujo de registro.

---

## 10.1 Información solicitada

El formulario de registro administrativo solicita:

* Nombre.  
* Apellido.  
* Email.  
* Contraseña.  
* Número de teléfono.  
* DNI.  
* Número de legajo.  
* Domicilio.  
* Provincia (Site).  
* Fecha de nacimiento.

---

## 10.2 Flujo de aprobación administrativa

El proceso es el siguiente:

1. El usuario completa el formulario de registro.  
2. La Admin Web App envía la solicitud al backend.  
3. El backend:  
* Busca un usuario existente con la información proporcionada.  
* Si existe, actualiza su rol a `toBeAdmin`.  
* Si no existe, crea el usuario con rol `toBeAdmin`.  
* Envía un correo de confirmación al usuario cuando corresponda.  
* Envía una solicitud de aprobación al SuperAdmin.  
4. El SuperAdmin recibe el correo y aprueba o rechaza la solicitud.

Si la solicitud es aprobada:

* El rol del usuario cambia a `Admin`.  
* El usuario recibe un correo indicando que ya puede utilizar la Admin Web App.

Si la solicitud es rechazada:

* El usuario vuelve a tener rol `Employee`.  
* Se envía una notificación por email indicando el rechazo.

---

## 10.3 Comportamiento del usuario toBeAdmin

Mientras el usuario se encuentre en estado `toBeAdmin`:

* Continúa utilizando la aplicación móvil normalmente.  
* Mantiene todos los permisos de empleado.  
* No puede acceder a la Admin Web App.

Si intenta iniciar sesión en la Admin Web App visualizará un mensaje:

"Su solicitud de acceso administrativo se encuentra pendiente de aprobación."

---

# **11\. Gestión de empleados**

La Admin Web App permite gestionar cuentas de empleados.

Esta funcionalidad es una de las responsabilidades principales del área administrativa.

---

## 11.1 Creación de empleados

Los administradores pueden crear empleados manualmente desde la interfaz.

Campos obligatorios:

* Nombre.  
* Apellido.  
* Número de legajo (`employee_id`).  
* DNI.  
* Email.  
* Contraseña inicial.  
* Número de teléfono.  
* Domicilio.  
* Provincia (Site).  
* Fecha de nacimiento.

---

Reglas:

* El Email debe ser único en todo el sistema.  
* El DNI debe ser único en todo el sistema.  
* El número de legajo debe ser único en todo el sistema.

Si alguno de estos valores ya existe, la creación será rechazada.

---

El empleado creado manualmente:

* Queda inmediatamente habilitado.  
* No requiere validar su email.  
* Puede utilizar la contraseña asignada por el administrador.  
* No está obligado a cambiar la contraseña en el primer ingreso.

Por motivos de seguridad:

* El administrador únicamente ingresa la contraseña durante la creación.  
* Luego de crear la cuenta no podrá visualizar nuevamente dicha contraseña.

Si el empleado olvida su contraseña deberá utilizar el flujo de recuperación por email disponible en la aplicación móvil.

---

## 11.2 Listado de empleados

La aplicación contará con una pantalla de listado de empleados.

La información mínima visible será:

* Nombre completo.  
* Número de legajo.  
* DNI.  
* Email.  
* Número de teléfono.  
* Provincia.  
* Estado de cuenta (Activo/Inactivo).  
* Acceso directo a:  
  * Perfil del empleado.  
  * Planillas.  
  * Documentos de legajo.

---

Ordenamiento por defecto:

Apellido y nombre en orden ascendente.

---

Búsquedas disponibles:

* Nombre.  
* Apellido.  
* Email.  
* Número de legajo.  
* DNI.

Las búsquedas serán parciales y no requerirán coincidencia exacta.

Ejemplo:

Buscar "Juan" deberá retornar:

* Juan Pérez.  
* Juan Gómez.  
* Juan Carlos Rodríguez.

---

## 11.3 Edición de empleados

Los administradores podrán modificar la información del empleado.

Ejemplos:

* Datos personales.  
* Información de contacto.  
* Provincia.  
* Información de legajo.

No podrán modificar:

* Rol del usuario.

La gestión de roles administrativos queda fuera del alcance del MVP.

---

## 11.4 Activación y desactivación de empleados

Los empleados no se eliminan del sistema.

El control de acceso se realiza mediante un estado:

**ACTIVE**

Permite:

* Iniciar sesión en la aplicación móvil.  
* Registrar horarios.  
* Registrar ausencias.  
* Subir documentos.  
* Subir planillas.

**INACTIVE**

Bloquea completamente al usuario.

No permite:

* Iniciar sesión.  
* Crear registros horarios.  
* Cargar ausencias.  
* Subir documentos.  
* Subir planillas.

Los registros históricos y toda la información asociada se mantienen en el sistema.

---

# Parte 3 — Modelo completo de registros horarios, intervalos, estados, orígenes, ausencias y reglas de negocio

---

# **12\. Concepto general de registro horario**

El registro horario es la entidad principal del sistema y representa la información de asistencia de un empleado para un día específico en un lugar de trabajo determinado.

Un registro está definido por la combinación única:

Usuario \+ Lugar de trabajo \+ Fecha

Restricción de unicidad:

(user\_id, workplace\_id, date)

Esto significa que:

* Un empleado puede tener varios registros el mismo día siempre que correspondan a distintos lugares de trabajo.  
* Un empleado no puede tener más de un registro en el mismo día para el mismo lugar de trabajo.  
* Un registro puede contener uno o múltiples intervalos.

Ejemplo:

Empleado: Juan Pérez  
Fecha: 10/05/2026

Puede existir:

Registro 1:  
Lugar de trabajo: Banco Nación Centro  
Intervalos:  
08:00 \- 12:00

Registro 2:  
Lugar de trabajo: Banco Nación Rawson  
Intervalos:  
14:00 \- 18:00

---

# **13\. Estructura de un registro**

Un registro está compuesto por:

* Usuario.  
* Lugar de trabajo.  
* Fecha.  
* Lista de intervalos.  
* Horas totales trabajadas.  
* Estado de completitud.  
* Estado administrativo/revisión.  
* Origen general del registro.  
* Observaciones generales (opcional).

---

# **14\. Cálculo de horas trabajadas**

El total trabajado de un registro se calcula como la suma de todos los intervalos de tipo `WORK`.

Ejemplo:

Intervalo 1:  
Tipo: WORK  
09:00 \- 12:00

Intervalo 2:  
Tipo: WORK  
13:00 \- 18:00

Resultado:

Horas trabajadas: 8 horas

---

Los intervalos de tipo ausencia no suman horas trabajadas.

Ejemplo:

ABSENCE  
09:00 \- 13:00

WORK  
13:00 \- 18:00

Resultado:

Horas trabajadas: 5 horas

Por el momento el sistema no genera métricas de horas de ausencia.

---

# **15\. Estados del registro**

El registro posee un estado que representa su nivel de completitud.

Valores posibles:

record\_status

COMPLETE  
INCOMPLETE

---

**COMPLETE**

Indica que todos los intervalos que componen el registro tienen información completa y consistente.

Ejemplo:

09:00 \- 18:00

---

**INCOMPLETE**

Indica que existe al menos un intervalo incompleto.

Ejemplos:

09:00 \-

o

\- 18:00

---

# **16\. Estado administrativo del registro**

Además del estado de completitud, el registro posee un estado administrativo que representa intervenciones manuales o validaciones realizadas por administración.

Valores posibles:

review\_status

NONE  
PENDING  
APPROVED  
REJECTED  
MANUAL\_LOADED

---

**NONE**

Estado por defecto cuando el registro fue generado correctamente y no requiere ninguna acción administrativa.

---

**PENDING**

Indica que el registro requiere revisión administrativa.

Ejemplos:

* Baja precisión GPS.  
* Registro fuera del área permitida pero dentro de un margen configurable.  
* Cualquier condición definida por las reglas de validación del backend.

Un registro pendiente debe ser revisado por administración.

---

**APPROVED**

El administrador revisó un registro pendiente y confirmó que la información es válida.

---

**REJECTED**

El administrador determinó que la información es inválida.

Comportamiento:

* El registro sigue apareciendo en la tabla de registros.  
* Debe destacarse visualmente como un problema pendiente.  
* Continúa siendo editable.  
* Una vez corregido por administración puede pasar nuevamente a un estado aprobado.

---

**MANUAL\_LOADED**

Indica que la administración intervino en la creación o modificación del registro.

Casos:

* El administrador crea un registro desde cero.  
* El administrador modifica un registro existente.

El objetivo de este estado es permitir identificar qué información requirió intervención manual.

---

# **17\. Origen del registro**

El registro posee un origen calculado a partir de sus intervalos.

Valores:

AUTOMATIC  
MANUAL

Reglas:

* Si todos los intervalos son automáticos, el registro es automático.  
* Si al menos un intervalo posee origen manual, el registro completo pasa a considerarse manual.

Ejemplo:

Intervalo 1:  
09:00 \- 12:00  
Origen: AUTOMATIC

Intervalo 2:  
13:00 \- 18:00  
Origen: MANUAL

Resultado:

Origen del registro: MANUAL

---

# **18\. Modelo de intervalos**

Un registro contiene una lista de intervalos.

Cada intervalo representa un período de tiempo asociado a trabajo o ausencia.

Un intervalo contiene:

* Tipo.  
* Hora de inicio.  
* Hora de fin.  
* Estado de completitud.  
* Estado de revisión.  
* Origen.  
* Observaciones.  
* Metadata de eventos de entrada y salida.

---

# **19\. Tipos de intervalos**

Valores posibles:

WORK  
ABSENCE

---

**WORK**

Representa tiempo efectivamente trabajado.

Puede ser generado:

* Automáticamente desde la aplicación móvil.  
* Manualmente por administración.

---

**ABSENCE**

Representa una ausencia.

Permite modelar:

* Ausencia completa.  
* Media ausencia.  
* Ausencia parcial.  
* Combinaciones de trabajo y ausencia dentro del mismo día.

Los intervalos de ausencia pueden contener:

* Hora de inicio.  
* Hora de fin.

Estos campos son opcionales para simplificar la experiencia del empleado en la aplicación móvil.

La administración puede completarlos posteriormente si lo considera necesario.

---

# **20\. Motivos de ausencia**

Los motivos de ausencia son un catálogo fijo definido en código.

No son configurables desde la aplicación.

Valores iniciales:

* Enfermedad.  
* Vacaciones.  
* Licencia.  
* ART.  
* Otros.

El motivo "Otros" no requiere una observación obligatoria.

La prioridad del MVP es mantener una experiencia simple para los empleados.

---

# **21\. Estados del intervalo**

El intervalo posee un estado propio independiente del registro.

Valores:

interval\_status

OPEN  
CLOSED  
SEMI\_CLOSED

---

**OPEN**

Existe una entrada pero no existe una salida.

Ejemplo:

09:00 \-

---

**CLOSED**

El intervalo posee entrada y salida.

Ejemplo:

09:00 \- 18:00

---

**SEMI\_CLOSED**

Existe una salida sin una entrada previa.

Ejemplo:

\- 18:00

---

# **22\. Estado de revisión del intervalo**

Los intervalos poseen su propio estado administrativo.

Valores:

interval\_review\_status

NONE  
PENDING  
APPROVED  
REJECTED

Este estado permite marcar individualmente problemas relacionados con la validación de un evento particular.

Ejemplo:

Un intervalo puede estar:

Estado:  
CLOSED

Revisión:  
PENDING

porque alguno de sus eventos requiere revisión administrativa.

---

# **23\. Algoritmo de construcción automática de intervalos**

La aplicación móvil registra eventos individuales.

Cada acción del empleado representa un evento de entrada o salida.

El sistema construye los intervalos siguiendo estas reglas.

---

**Nuevo evento de entrada**

Siempre crea un nuevo intervalo.

Ejemplo:

Eventos:

Entrada 09:00  
Entrada 11:00

Resultado:

09:00 \-  
11:00 \-

---

**Nuevo evento de salida**

El sistema busca el último intervalo abierto.

Si existe, completa su salida.

Ejemplo:

Eventos:

Entrada 09:00  
Entrada 11:00  
Salida 12:00

Resultado:

09:00 \-  
11:00 \- 12:00

---

Si no existe un intervalo abierto, se crea un nuevo intervalo con solamente la salida.

Ejemplo:

Eventos:

Entrada 09:00  
Entrada 11:00  
Salida 12:00  
Salida 18:00

Resultado:

09:00 \-  
11:00 \- 12:00  
\- 18:00

Estos escenarios representan errores de uso o fallos operativos y posteriormente podrán ser corregidos por administración.

---

# **24\. Metadata de eventos**

Cada evento de entrada y salida puede almacenar información adicional.

Esta información será visible en la Admin Web App mediante una sección de detalle expandible para evitar sobrecargar la interfaz principal.

Metadata esperada:

* Timestamp exacto.  
* Latitud.  
* Longitud.  
* Precisión GPS.  
* Información del dispositivo.  
* Origen del evento.

---

# **25\. Edición administrativa de registros**

La administración posee control total sobre los registros.

Puede:

* Editar un registro existente.  
* Editar horarios de entrada o salida.  
* Agregar nuevos intervalos.  
* Corregir información errónea.  
* Crear registros completamente nuevos.

La edición se realiza registro por registro.

Desde la tabla de registros el administrador realizará doble clic sobre una celda para abrir una vista de detalle o modal de edición.

---

# **26\. Eliminación de registros**

Los registros no pueden eliminarse desde la Admin Web App.

La decisión del MVP es mantener la integridad histórica de la información.

Cuando un registro posee errores, debe corregirse mediante edición.

---

# **27\. Futuras extensiones previstas**

El modelo actual permite futuras funcionalidades como:

* Gestión formal de solicitudes de vacaciones.  
* Flujos de aprobación de ausencias.  
* Métricas avanzadas de ausentismo.  
* Auditoría de modificaciones.  
* Reglas de validación más complejas.

El diseño actual busca permitir estas extensiones sin requerir cambios estructurales importantes.

---

# Parte 4 — Gestión de clientes, provincias (sites), lugares de trabajo y configuración geográfica

---

# **28\. Modelo organizacional**

La estructura organizacional del sistema se compone de los siguientes conceptos:

* Provincia (`Site`).  
* Cliente (`Client`).  
* Lugar de trabajo (`Workplace`).

La nomenclatura interna del sistema se mantiene en inglés por consistencia con el código y desarrollo, pero en la interfaz de usuario se utilizarán nombres en español.

Ejemplos:

| Desarrollo | Interfaz |
| ----- | ----- |
| Site | Provincia |
| Client | Cliente |
| Workplace | Lugar de trabajo |

---

# **29\. Provincias (Sites)**

Un Site representa una provincia de Argentina.

Ejemplos:

* San Juan.  
* Mendoza.  
* San Luis.  
* La Rioja.  
* Salta.  
* Catamarca.

El sistema MVP opera exclusivamente dentro de Argentina bajo una única zona horaria:

GMT \-3

Las fechas y horarios se almacenan y procesan utilizando esta zona horaria local.

---

## 29.1 Relación con usuarios

Un usuario empleado pertenece a una única provincia.

Objetivos de esta relación:

* Permitir filtros administrativos.  
* Facilitar vistas por región operativa.  
* Clasificación organizacional de empleados.

Relación:

Site 1:N Usuarios

---

## 29.2 Relación con lugares de trabajo

Un lugar de trabajo pertenece obligatoriamente a una provincia.

Un Site puede existir aunque no tenga lugares de trabajo asociados.

Relación:

Site 1:N Workplaces

---

# **30\. Clientes**

Un cliente representa la entidad comercial para la cual la empresa presta servicios.

Ejemplos:

* Banco Nación.  
* Empresa privada.  
* Institución pública.

Un cliente puede tener lugares de trabajo distribuidos en distintas provincias.

Ejemplo:

Cliente: Banco Nación

Workplace 1:  
Provincia: San Juan  
Sucursal Centro

Workplace 2:  
Provincia: Mendoza  
Sucursal Capital

---

## 30.1 Estado del cliente

Los clientes no se eliminan del sistema.

Poseen un estado:

ACTIVE  
INACTIVE

---

**ACTIVE**

El cliente se encuentra operativo.

Sus lugares de trabajo pueden utilizarse normalmente para nuevos registros.

---

**INACTIVE**

El cliente queda deshabilitado para operaciones futuras.

Su información histórica se mantiene:

* Registros horarios históricos.  
* Planillas asociadas.  
* Documentos relacionados indirectamente.

---

## 30.2 Relación con lugares de trabajo

Un cliente puede tener múltiples lugares de trabajo.

Un lugar de trabajo siempre debe pertenecer a un único cliente.

Relación:

Cliente 1:N Workplaces

---

Un cliente puede existir sin tener lugares de trabajo asociados.

---

# **31\. Lugares de trabajo (Workplaces)**

Un Workplace representa una ubicación específica donde un empleado realiza su actividad laboral.

Ejemplos:

* Banco Nación — Sucursal Centro.  
* Banco Nación — Sucursal Rawson.  
* Oficina administrativa.  
* Planta industrial.

---

## 31.1 Relaciones obligatorias

Todo Workplace debe pertenecer obligatoriamente a:

* Un Cliente.  
* Una Provincia (Site).

No puede existir un Workplace sin estas asociaciones.

Relaciones:

Cliente 1:N Workplace

Site 1:N Workplace

---

## 31.2 Estado del Workplace

Los lugares de trabajo no se eliminan del sistema.

Poseen los siguientes estados:

ACTIVE  
INACTIVE

---

**ACTIVE**

El lugar de trabajo puede ser utilizado normalmente para:

* Nuevos registros horarios.  
* Nuevas planillas.  
* Operaciones futuras del sistema.

---

**INACTIVE**

El lugar de trabajo deja de estar disponible para nuevas operaciones.

Se conserva la información histórica asociada:

* Registros.  
* Planillas.  
* Reportes históricos.

---

# **32\. Creación de un lugar de trabajo**

El administrador puede crear nuevos lugares de trabajo desde la Admin Web App.

Flujo:

1. Selecciona el cliente al que pertenece.  
2. Selecciona la provincia.  
3. Ingresa el nombre del lugar de trabajo.  
4. Configura la zona geográfica permitida para los registros.  
5. Guarda la información.

---

# **33\. Configuración geográfica del Workplace**

Cada lugar de trabajo tiene una configuración geográfica que determina desde dónde los empleados pueden registrar asistencia.

La configuración inicial del MVP utilizará únicamente áreas circulares.

Campo interno:

shape\_type \= CIRCLE

---

## 33.1 Selección de ubicación

El administrador podrá configurar la ubicación mediante un mapa.

Opciones disponibles:

* Buscar una dirección.  
* Mover un marcador manualmente.

El mapa mostrará visualmente la ubicación seleccionada.

---

## 33.2 Radio permitido

Una vez seleccionada la ubicación, el administrador define un radio permitido expresado en metros.

Ejemplo:

Centro:  
\-31.5375, \-68.5364

Radio:  
100 metros

El sistema mostrará visualmente el círculo permitido sobre el mapa.

---

## 33.3 Precisión mínima de GPS

Opcionalmente se podrá configurar un umbral mínimo de precisión GPS.

Ejemplo:

gps\_accuracy\_threshold \= 30 metros

Esta configuración permitirá que el backend determine si un registro requiere revisión administrativa.

Ejemplos de casos:

* GPS con baja precisión.  
* Registro fuera del área permitida pero dentro de una tolerancia aceptada.

Estos casos pueden generar registros con estado de revisión:

PENDING

para que sean evaluados posteriormente por administración.

---

# **34\. Datos enviados al backend al crear o modificar un Workplace**

Información principal:

client\_id  
site\_id  
workplace\_name

Configuración geográfica:

shape\_type \= CIRCLE

latitude  
longitude  
radius\_meters  
gps\_accuracy\_threshold

---

# **35\. Gestión y visualización de lugares de trabajo**

La Admin Web App permitirá:

* Listar clientes.  
* Crear clientes.  
* Editar clientes.  
* Activar o desactivar clientes.

---

También permitirá:

* Listar lugares de trabajo.  
* Crear lugares de trabajo.  
* Editar lugares de trabajo.  
* Activar o desactivar lugares de trabajo.  
* Visualizar su configuración geográfica.

---

# **36\. Búsquedas y filtros**

Las pantallas de administración permitirán realizar búsquedas y filtros sobre la estructura organizacional.

Ejemplos:

**Clientes**

Filtros posibles:

* Nombre.  
* Estado.

---

**Lugares de trabajo**

Filtros posibles:

* Nombre.  
* Cliente asociado.  
* Provincia.  
* Estado.

---

Las búsquedas serán parciales y no requerirán coincidencia exacta.

Ejemplo:

Buscar:

Banco

Debe permitir encontrar:

* Banco Nación Centro.  
* Banco Nación Rawson.

---

# **37\. Consideraciones futuras fuera del MVP**

El modelo está diseñado para soportar futuras extensiones, tales como:

* Múltiples zonas permitidas por un mismo Workplace.  
* Geometrías más complejas (polígonos).  
* Configuraciones de validación más avanzadas.  
* Reglas específicas por cliente o región.

Estas funcionalidades no forman parte de la primera versión.

---

# Parte 5 — Gestión de planillas y documentos de legajo

---

# **38\. Conceptos generales de archivos del sistema**

La Admin Web App gestiona dos tipos principales de archivos:

1. **Planillas de horas**  
2. **Documentos de legajo**

Aunque ambos son archivos adjuntos, cumplen objetivos distintos y se gestionan en módulos separados.

## 38.1 Planillas de horas

Representan documentos asociados al control de asistencia de un empleado durante un período específico y un lugar de trabajo determinado.

Su objetivo principal en el MVP es servir como soporte documental para que la administración pueda visualizar la información original y posteriormente cargar manualmente los registros horarios correspondientes.

En esta primera versión:

* La carga de una planilla **no genera registros automáticamente**.  
* La información contenida en la imagen o documento no es procesada por el sistema.  
* La carga manual de los registros será responsabilidad de la administración.

En futuras versiones podría incorporarse procesamiento automático mediante OCR o mecanismos similares.

---

## 38.2 Documentos de legajo

Representan archivos asociados a la información personal y laboral del empleado.

Ejemplos:

* DNI.  
* Certificados médicos.  
* Contratos.  
* ART.  
* Documentación de EPP.  
* Ficha médica.  
* Normas internas.  
* Declaración de domicilio.  
* Otros.

Los documentos de legajo no están asociados directamente a registros horarios ni a ausencias.

Por ejemplo:

Un certificado médico se almacena dentro del legajo del empleado, pero no queda vinculado técnicamente a una ausencia específica.

Esta decisión simplifica el modelo del MVP y mantiene separados los conceptos de asistencia y documentación personal.

---

# **39\. Gestión de planillas**

## 39.1 Modelo de una planilla

Una planilla está asociada a:

* Un empleado.  
* Un lugar de trabajo.  
* Un mes.  
* Un año.

Puede existir más de una planilla para una misma combinación:

empleado \+ workplace \+ mes \+ año

Por ejemplo:

Empleado: Juan Pérez  
Lugar de trabajo: Banco Nación Centro  
Periodo: Mayo 2026

Planilla 1  
Planilla 2  
Planilla 3

El orden entre múltiples planillas de un mismo período se determina mediante un número secuencial interno.

---

## 39.2 Estados de una planilla

Una planilla puede encontrarse en uno de los siguientes estados:

PENDING  
LOADED  
ERROR

---

**PENDING**

Estado inicial de toda planilla cargada.

Significa que la administración aún no terminó de procesarla.

Puede corresponder a casos como:

* La planilla aún no fue revisada.  
* Todavía faltan cargar registros horarios asociados.

---

**LOADED**

Indica que la administración ya procesó la planilla y considera que su información fue cargada correctamente al sistema.

No implica una validación formal ni un flujo de aprobación.

Simplemente representa que ya no requiere trabajo pendiente.

---

**ERROR**

Indica que la administración no pudo procesar la planilla.

Ejemplos:

* Archivo ilegible.  
* Imagen con mala calidad.  
* Documento corrupto.  
* Información insuficiente.

---

## 39.3 Carga de planillas

Una planilla puede ser cargada desde:

* La aplicación móvil por el empleado.  
* La Admin Web App por un administrador.

En ambos casos el comportamiento es exactamente el mismo:

* El archivo se almacena en el sistema.  
* Su estado inicial es `PENDING`.  
* No se generan registros horarios automáticamente.

---

**Información requerida al subir una planilla**

Al realizar la carga se debe indicar:

* Empleado asociado.  
* Lugar de trabajo asociado.  
* Mes correspondiente.  
* Año correspondiente.  
* Archivo adjunto.

---

**Formatos permitidos**

Formatos aceptados:

* PDF.  
* JPG.  
* JPEG.  
* PNG.  
* DOC.  
* DOCX.  
* TXT.

---

**Tamaño máximo permitido**

Tamaño máximo por archivo:

20 MB

---

## 39.4 Visualización de planillas

La administración podrá acceder a una pantalla de listado de planillas.

La información visible incluirá como mínimo:

* Empleado.  
* Lugar de trabajo.  
* Cliente asociado.  
* Provincia.  
* Mes.  
* Año.  
* Número de planilla dentro del período.  
* Estado.  
* Fecha de carga.  
* Usuario que realizó la carga.

---

**Ordenamiento por defecto**

Las planillas se ordenan desde las más recientes hacia las más antiguas.

La prioridad de orden es:

1. Año descendente.  
2. Mes descendente.  
3. Número de planilla descendente.

Ejemplo:

Mayo 2026 \- Planilla 3  
Mayo 2026 \- Planilla 2  
Mayo 2026 \- Planilla 1  
Abril 2026 \- Planilla 1

---

**Búsquedas y filtros**

La pantalla debe permitir filtrar por:

* Empleado.  
* Cliente.  
* Lugar de trabajo.  
* Provincia.  
* Mes.  
* Año.  
* Estado.

Las búsquedas textuales deben ser parciales y no requieren coincidencia exacta.

---

## 39.5 Gestión administrativa de planillas

Los administradores pueden:

* Visualizar el archivo.  
* Cambiar su estado.  
* Reemplazar el archivo original.

No pueden eliminar una planilla en el MVP.

---

**Reemplazo de archivos**

Cuando un administrador reemplaza una planilla:

* El archivo anterior se elimina del sistema.  
* El nuevo archivo pasa a ser la versión vigente.

Antes de realizar la acción se debe mostrar una confirmación explícita indicando que el archivo anterior será eliminado permanentemente.

---

# **40\. Gestión de documentos de legajo**

## 40.1 Origen de los documentos

Los documentos pueden ser cargados por:

* El empleado desde la aplicación móvil.  
* Un administrador desde la Admin Web App.

Ambos tipos de documentos son visibles desde la administración.

---

## 40.2 Modelo de documento de legajo

La información mínima de un documento es:

id  
employee\_id  
employee\_name  
document\_type  
format  
file\_name  
uploaded\_by  
created\_at  
updated\_at

---

**Tipos de documento**

Los tipos disponibles inicialmente son:

* DNI.  
* Certificado médico.  
* Contrato.  
* ART.  
* Documentación EPP.  
* Ficha médica.  
* Normas internas.  
* Declaración de domicilio.  
* Otros.

Este catálogo está definido en código y no es configurable desde la interfaz administrativa.

---

**Formatos permitidos**

Los mismos formatos que las planillas:

* PDF.  
* JPG.  
* JPEG.  
* PNG.  
* DOC.  
* DOCX.  
* TXT.

---

**Tamaño máximo permitido**

Máximo:

20 MB por archivo

---

## 40.3 Visualización de documentos

La sección de legajos permitirá visualizar los documentos de los empleados.

La información mínima visible será:

* Nombre del archivo.  
* Tipo de documento.  
* Empleado asociado.  
* Usuario que realizó la carga.  
* Fecha de carga.  
* Última actualización.

---

**Ordenamiento por defecto**

Los documentos se ordenan desde los más recientes hacia los más antiguos según su fecha de creación.

---

**Búsquedas y filtros**

La administración podrá filtrar por:

* Empleado.  
* Tipo de documento.  
* Fecha de carga.  
* Usuario que realizó la carga.

Las búsquedas de texto serán parciales.

---

## 40.4 Edición de documentos

Un administrador podrá:

* Cambiar el tipo de documento.  
* Modificar el nombre visible del archivo.

Esto permite corregir errores de clasificación o mejorar la organización del legajo.

---

## 40.5 Eliminación de documentos

Los documentos de legajo sí pueden ser eliminados por administración.

La eliminación debe requerir una confirmación explícita antes de ejecutarse.

---

## 40.6 Consideraciones futuras fuera del MVP

El diseño permite incorporar posteriormente funcionalidades como:

* Fechas de vencimiento de documentos.  
* Alertas por documentación próxima a vencer.  
* Versionado de documentos.  
* Solicitudes de documentación faltante.  
* Flujos de aprobación o validación de documentos.

Estas capacidades no forman parte de la primera versión.

---

# Parte 6 — Pantallas principales, navegación, dashboard y experiencia de usuario (UX)

---

# **41\. Principios generales de diseño de la Admin Web App**

La Admin Web App está diseñada como una herramienta operativa de uso diario por parte del equipo administrativo de la empresa (recursos humanos, supervisores, gerentes, etc.).

El objetivo principal de la interfaz es maximizar la eficiencia operativa, permitiendo realizar tareas frecuentes de forma rápida y con la menor cantidad de clics posibles.

Los principios de diseño del MVP son:

* Priorizar la velocidad de trabajo por encima del minimalismo visual.  
* Mantener interfaces limpias y fáciles de entender.  
* Evitar información innecesaria o ruido visual.  
* Mostrar información relevante de forma resumida, permitiendo expandir el detalle cuando sea necesario.  
* Mantener consistencia visual y de interacción en todos los módulos.  
* Favorecer acciones explícitas para evitar errores accidentales.

---

# **42\. Plataforma objetivo**

La primera versión de la Admin Web App está pensada principalmente para uso en computadoras de escritorio.

Decisión MVP:

Desktop First

No es un requisito soportar tablets o dispositivos móviles en esta primera versión.

Sin embargo, la arquitectura de componentes y el diseño de la interfaz deben intentar no bloquear futuras adaptaciones responsive.

---

# **43\. Idioma y terminología**

Toda la interfaz será presentada en español.

Los términos internos del desarrollo pueden permanecer en inglés, pero nunca deben exponerse al usuario final.

Ejemplos:

| Término interno | UI |
| ----- | ----- |
| User | Usuario |
| Employee | Empleado |
| Client | Cliente |
| Site | Provincia |
| Workplace | Lugar de trabajo |
| Record | Registro |
| Interval | Intervalo |
| Document | Documento |
| Dashboard | Inicio |

---

# **44\. Sistema visual y colores**

La aplicación utilizará una identidad visual simple y profesional.

Colores principales definidos:

| Uso | Color |
| ----- | ----- |
| Primary | `#0D80AE` |
| Secondary | `#62882B` |
| Accent | `#ED701E` |
| Foreground | `#0F172A` |
| Muted | `#EDF2F5` |

Se podrán agregar colores secundarios según sea necesario para representar estados del sistema, por ejemplo:

* Éxito.  
* Error.  
* Advertencia.  
* Información.  
* Estados pendientes.

Los colores de estados deben utilizarse de forma consistente en toda la aplicación.

Ejemplos posibles:

* Verde → correcto / aprobado.  
* Rojo → error / rechazado.  
* Amarillo o naranja → pendiente.  
* Gris → inactivo.

La definición exacta de la paleta extendida podrá realizarse durante la etapa de diseño UI.

---

# **45\. Estructura general de navegación**

La navegación principal se realiza mediante un sidebar lateral persistente.

Los módulos principales del sistema son:

1. Inicio.  
2. Registros.  
3. Usuarios.  
4. Lugares de trabajo.  
5. Planillas.  
6. Legajos.

El sidebar debe permitir acceder rápidamente a cualquier módulo desde cualquier pantalla.

---

# **46\. Header superior**

La aplicación contará con una barra superior (header) que incluirá información y acciones globales.

Puede incluir:

* Nombre de la aplicación.  
* Información del usuario administrador autenticado.  
* Acceso al perfil del usuario.  
* Opción de cerrar sesión.

La cantidad exacta de elementos podrá ajustarse durante la implementación de la interfaz.

---

# **47\. Página de Inicio (Dashboard)**

La pantalla inicial tiene como objetivo mostrar el estado general de la operación.

No debe funcionar como un panel analítico complejo, sino como una vista rápida que permita identificar tareas pendientes.

---

**Métricas principales**

Inicialmente se mostrarán las siguientes métricas:

**Planillas pendientes**

Cantidad de planillas con estado:

PENDING

Representa trabajo administrativo pendiente.

---

**Registros incompletos**

Cantidad de registros con:

record\_status \= INCOMPLETE

Indica registros que requieren intervención para completar información faltante.

---

**Registros pendientes de validación**

Cantidad de registros con:

review\_status \= PENDING

Ejemplos:

* Baja precisión GPS.  
* Ubicación fuera del área permitida dentro del margen de tolerancia definido por el backend.  
* Cualquier otra regla de validación futura.

---

**Cantidad de ausencias**

Cantidad total de registros que contienen intervalos de tipo:

ABSENCE

Por el momento no se calculan métricas de duración de ausencias ni estadísticas avanzadas.

---

# **48\. Navegación desde el Dashboard**

Las métricas del dashboard deben funcionar como accesos rápidos.

Ejemplos:

* Click en "Planillas pendientes" → abre la pantalla de planillas con el filtro `PENDING` aplicado.  
* Click en "Registros incompletos" → abre registros filtrando `record_status = INCOMPLETE`.  
* Click en "Registros pendientes de validación" → abre registros filtrando `review_status = PENDING`.

El objetivo es reducir la cantidad de pasos necesarios para realizar tareas frecuentes.

---

# **49\. Diseño de tablas administrativas**

La mayor parte del sistema utiliza tablas como componente principal de visualización.

Principios:

* Alta densidad de información.  
* Lectura rápida.  
* Filtros visibles.  
* Acciones accesibles.  
* Ordenamiento claro.  
* Evitar navegación innecesaria entre pantallas.

Las tablas deberán soportar:

* Búsqueda textual.  
* Filtros avanzados.  
* Ordenamiento.  
* Paginación cuando corresponda.  
* Estados de carga.  
* Estados vacíos.  
* Estados de error.

---

# **50\. Estados de carga de la interfaz**

La aplicación no debe mostrar información incompleta o inconsistente mientras espera una respuesta del servidor.

Durante la carga de información se utilizarán componentes tipo:

Skeleton Loading

El skeleton debe representar aproximadamente la estructura final de la pantalla para reducir la sensación de espera.

Ejemplo:

* Skeleton de tarjetas para métricas.  
* Skeleton de filas de tablas.  
* Skeleton de formularios.

---

# **51\. Estados vacíos**

Cuando una consulta no devuelve resultados, la interfaz debe indicarlo claramente.

Ejemplos:

* No existen registros para los filtros seleccionados.  
* No hay planillas pendientes.  
* No existen documentos cargados.

Los estados vacíos deben incluir:

* Un mensaje descriptivo.  
* Una explicación breve cuando sea útil.  
* Una acción recomendada cuando aplique.

Ejemplo:

No se encontraron registros para los filtros seleccionados.

Limpiar filtros.

---

# **52\. Estados de error**

Los errores deben diferenciar entre situaciones recuperables y no recuperables.

---

**Errores recuperables**

Ejemplos:

429  
500  
502  
503  
504

Comportamiento:

* Reintentos automáticos.  
* Backoff exponencial.  
* Mostrar estado de carga mientras el sistema intenta recuperarse.

---

**Errores no recuperables**

Ejemplos:

400  
401  
403  
404  
422

Comportamiento:

* Mostrar una interfaz de error clara.  
* Explicar al usuario que la operación no pudo completarse.  
* Permitir reintentar manualmente cuando tenga sentido.

---

# **53\. Mensajes temporales (Toast)**

Los mensajes flotantes se utilizarán únicamente en acciones puntuales.

Ejemplos:

**Éxito**

* Usuario creado correctamente.  
* Documento actualizado correctamente.  
* Registro modificado correctamente.

---

**Error**

* No fue posible guardar los cambios.  
* El archivo seleccionado no es válido.

Los toasts no se utilizarán para errores de carga de páginas completas, donde debe existir una interfaz de error dedicada.

---

# **54\. Confirmaciones de acciones críticas**

Las acciones destructivas o irreversibles deben solicitar confirmación explícita.

Ejemplos:

* Eliminar un documento de legajo.  
* Reemplazar una planilla existente.  
* Desactivar un usuario.  
* Desactivar un cliente.  
* Desactivar un lugar de trabajo.

La confirmación debe explicar claramente las consecuencias de la acción.

---

# **55\. Accesibilidad y usabilidad**

Aunque no es un objetivo principal del MVP cumplir estándares avanzados de accesibilidad, se deben seguir buenas prácticas generales:

* Contraste adecuado entre colores.  
* Tamaños de texto legibles.  
* Áreas de clic suficientemente grandes.  
* Navegación consistente.  
* Estados visuales claros para acciones disponibles, deshabilitadas o con errores.

---

# **56\. Funcionalidades fuera del alcance del MVP**

No se implementarán inicialmente:

* Modo oscuro.  
* Configuración personalizada de interfaz.  
* Notificaciones en tiempo real.  
* Centro de alertas.  
* Dashboard analítico avanzado.  
* Adaptación completa a dispositivos móviles o tablets.

Estas funcionalidades podrán evaluarse en futuras iteraciones según la necesidad operativa.

---

# Parte 7 — Performance, manejo de datos, caché, errores, seguridad y decisiones técnicas de frontend

---

# **57\. Objetivo de esta sección**

Esta sección define las decisiones técnicas transversales de la Admin Web App relacionadas con:

* Performance.  
* Obtención y sincronización de datos.  
* Manejo de caché.  
* Comunicación con backend.  
* Gestión de estados de carga y error.  
* Seguridad del lado del frontend.  
* Escalabilidad de la aplicación.

Estas decisiones tienen como objetivo construir una aplicación rápida, robusta y preparada para crecer, manteniendo una buena experiencia de usuario incluso con cientos de empleados y grandes volúmenes de registros.

---

# **58\. Volumen esperado y criterios de escalabilidad**

El sistema está diseñado inicialmente para una empresa con cientos de empleados.

Escenario esperado:

* Menos de 600 empleados.  
* Miles de registros horarios por mes.  
* Decenas o cientos de lugares de trabajo.  
* Múltiples clientes distribuidos en distintas provincias.

No se espera, en el corto plazo, una escala de decenas de miles de usuarios.

Por esta razón, algunas optimizaciones complejas no forman parte del MVP.

---

# **59\. Estrategia general de obtención de datos**

La aplicación utilizará una estrategia **server-driven**.

Esto significa que las operaciones costosas se realizan principalmente en backend:

* Filtrado.  
* Ordenamiento.  
* Paginación.  
* Cálculo de métricas.  
* Agregaciones.

El frontend tendrá como responsabilidad:

* Solicitar datos.  
* Mostrar información.  
* Mantener caché local.  
* Administrar estados de interfaz.

---

# **60\. React Query como capa de manejo de datos**

La aplicación utilizará **TanStack Query (React Query)** como herramienta principal para gestionar:

* Fetching de datos.  
* Caché client-side.  
* Sincronización con backend.  
* Reintentos automáticos.  
* Estados de loading y error.  
* Invalidación inteligente de información.

---

# **61\. Estrategia de caché client-side**

Se utilizará una estrategia basada en:

* Mostrar datos desde caché cuando existan.  
* Actualizar información en segundo plano.  
* Refrescar únicamente cuando sea necesario.

Flujo general:

1. El usuario abre una pantalla.  
2. React Query verifica si existe información en caché.  
3. Si existe:  
   * La muestra inmediatamente.  
   * Realiza una consulta en segundo plano al servidor.  
4. Si el servidor devuelve información actualizada:  
   * La interfaz se actualiza automáticamente.

Este comportamiento mejora significativamente la percepción de velocidad de la aplicación.

---

# **62\. Invalidación de caché**

La información no se refrescará constantemente.

La estrategia principal será la invalidación de queries luego de acciones que modifican información.

Ejemplos:

**Edición de un registro**

Acción:

Editar registro

Resultado:

Invalidar:  
\- Lista de registros.  
\- Métricas relacionadas.  
\- Dashboard si corresponde.

---

**Creación de un usuario**

Invalidar:

Listado de usuarios.

---

**Modificación de un workplace**

Invalidar:

\- Lista de lugares de trabajo.  
\- Información dependiente.

---

La invalidación debe ser lo más específica posible para evitar recargas innecesarias.

---

# **63\. Configuración general de React Query**

Configuraciones definidas:

**refetchOnWindowFocus**

Valor:

false

La aplicación no volverá a consultar el backend automáticamente cuando el usuario regrese a la pestaña del navegador.

Esto evita:

* Consultas innecesarias.  
* Saltos visuales inesperados.  
* Consumo adicional de recursos.

---

**refetchOnReconnect**

Valor:

true

Cuando el dispositivo recupere conexión a internet, la aplicación intentará sincronizar nuevamente la información.

---

# **64\. Tiempos de caché según módulo**

No todos los datos tienen la misma frecuencia de cambio.

---

**Información altamente operativa**

Ejemplos:

* Registros horarios.  
* Dashboard.  
* Planillas pendientes.

Estrategia:

* Caché corta.  
* Posibilidad de actualización manual por el usuario.  
* Invalidaciones frecuentes después de modificaciones.

---

**Catálogos y configuraciones**

Ejemplos:

* Clientes.  
* Provincias.  
* Lugares de trabajo.  
* Tipos de documentos.

Estrategia:

* Caché más extensa.  
* Menor frecuencia de actualización.

---

Los valores exactos de `staleTime` y `gcTime` podrán definirse durante la implementación y ajustarse según el comportamiento real del sistema.

---

# **65\. Paginación, filtros y ordenamiento**

Todas las consultas de grandes conjuntos de datos utilizarán estrategias server-side.

---

**Filtros**

Todos los filtros se aplican en backend.

Ejemplos:

* Empleado.  
* Cliente.  
* Lugar de trabajo.  
* Provincia.  
* Estados de registros.  
* Estados de planillas.

Motivos:

* Reducir transferencia de datos.  
* Mejorar escalabilidad.  
* Mantener consistencia en métricas.

---

**Ordenamiento**

Todo ordenamiento será realizado por el backend.

Ejemplos:

* Usuarios por apellido y nombre.  
* Planillas por fecha descendente.  
* Documentos por fecha descendente.  
* Registros por empleado y lugar de trabajo.

---

**Paginación tradicional**

Se utilizará en:

* Usuarios.  
* Clientes.  
* Lugares de trabajo.  
* Planillas.  
* Documentos.

La interfaz mostrará controles tradicionales de navegación entre páginas.

---

**Carga incremental (infinite scroll)**

Se utilizará exclusivamente en la tabla de registros.

Comportamiento:

* El usuario se desplaza verticalmente.  
* La aplicación solicita nuevas páginas automáticamente.  
* La información se agrega a la tabla existente.  
* la tabla/cuadrícula de registros operará con Scroll Dinámico y no con paginación de botones.

---

# **66\. Virtualización de listas**

Decisión MVP:

No implementar virtualización.

Justificación:

* El período máximo de registros es un mes.  
* El volumen esperado es manejable.  
* La complejidad adicional no aporta beneficios significativos en esta etapa.

Esta decisión podrá revisarse en futuras versiones si la cantidad de información aumenta considerablemente.

---

# **67\. Estados de carga (Loading)**

La aplicación debe evitar mostrar información parcial o inconsistente.

Durante la carga se utilizarán componentes **Skeleton**.

Ejemplos:

* Tarjetas del dashboard.  
* Tablas.  
* Formularios.  
* Paneles de detalle.

El objetivo es mantener la estructura visual de la pantalla y reducir la sensación de espera.

---

# **68\. Estados vacíos (Empty states)**

Cuando una consulta no devuelve información se debe mostrar un estado explícito.

Ejemplos:

* No existen registros para los filtros seleccionados.  
* No hay documentos cargados.  
* No hay planillas pendientes.

El estado vacío puede incluir:

* Mensaje descriptivo.  
* Explicación breve.  
* Acción sugerida cuando tenga sentido.

---

# **69\. Estrategia de manejo de errores**

Los errores se clasifican en dos grupos:

* Errores reintentables.  
* Errores no reintentables.

La clasificación debe mantenerse centralizada en un módulo configurable.

Ejemplo:

retryableStatusCodes \= \[  
  429,  
  500,  
  502,  
  503,  
  504  
\];

Esto permite adaptarse fácilmente a futuras decisiones del backend.

---

# **70\. Errores reintentables**

Ejemplos:

* Timeout.  
* Límite temporal de solicitudes.  
* Fallos internos del servidor.  
* Problemas temporales de infraestructura.

Comportamiento:

* React Query realizará reintentos automáticos.  
* Se utilizará backoff exponencial.  
* La interfaz permanecerá en estado de carga mientras el sistema intenta recuperarse.

---

# **71\. Errores no reintentables**

Ejemplos:

* Solicitud inválida.  
* Recurso inexistente.  
* Falta de permisos.  
* Datos incorrectos enviados por el usuario.

Ejemplos de códigos:

400  
401  
403  
404  
422

Comportamiento:

* No realizar reintentos automáticos.  
* Mostrar un estado de error claro al usuario.  
* Permitir reintentar manualmente cuando corresponda.

---

# **72\. Uso de notificaciones tipo Toast**

Los mensajes temporales se utilizarán únicamente para acciones puntuales.

Ejemplos de éxito:

* Registro actualizado correctamente.  
* Usuario creado correctamente.  
* Documento eliminado correctamente.

Ejemplos de error:

* No fue posible guardar los cambios.  
* El archivo seleccionado no es válido.

No deben utilizarse para representar fallos de carga de una pantalla completa.

---

# **73\. Seguridad en el frontend**

El frontend debe considerar que toda la seguridad real es responsabilidad del backend.

Las validaciones del frontend tienen como objetivo:

* Mejorar la experiencia del usuario.  
* Reducir errores de ingreso.  
* Guiar la interacción.

El backend siempre debe validar:

* Autenticación.  
* Permisos.  
* Roles.  
* Integridad de los datos.

---

# **74\. Manejo de autenticación en el frontend**

El frontend trabajará con:

* Access Token (duración aproximada: 30 minutos).  
* Refresh Token (duración aproximada: 7 días con rotación).

Responsabilidades del frontend:

* Adjuntar el access token en las solicitudes autenticadas.  
* Detectar expiración de sesión.  
* Intentar renovar el access token mediante el refresh token.  
* Redirigir al login cuando la sesión ya no pueda renovarse.

---

# **75\. Manejo de sesión persistente**

La opción “Recordar sesión” permite mantener la sesión activa hasta el límite definido por el sistema.

Duración máxima:

7 días

Al finalizar ese período, el usuario deberá autenticarse nuevamente.

---

# **76\. Timezone y manejo de fechas**

El sistema opera únicamente en Argentina.

Decisión del MVP:

Timezone única: GMT-3 (Argentina)

Tanto el backend como el frontend trabajarán utilizando esta zona horaria.

No se implementará conversión entre zonas horarias.

---

# **77\. Internacionalización**

La Admin Web App no tendrá soporte multiidioma en el MVP.

Idioma único:

Español

Los nombres internos del código pueden permanecer en inglés, pero nunca deben mostrarse directamente al usuario final.

---

# **78\. Consideraciones futuras**

Las siguientes optimizaciones quedan fuera del MVP, pero la arquitectura debe permitir incorporarlas posteriormente:

* WebSockets o actualizaciones en tiempo real.  
* Sincronización automática de cambios entre múltiples administradores.  
* Virtualización de tablas.  
* Caché offline.  
* Modo de funcionamiento sin conexión.  
* Políticas avanzadas de refresco de datos.  
* Métricas de performance del cliente.

---

# Parte 8 — Reglas de API, contratos esperados, modelos TypeScript sugeridos y consideraciones para implementación con React

---

# **79\. Objetivo de la capa de comunicación con Backend**

La Admin Web App debe diseñarse de manera desacoplada del backend específico que se implemente en el futuro.

Aunque durante las primeras etapas del desarrollo se podrán utilizar:

* Mocks.  
* Datos estáticos.  
* APIs simuladas.

La arquitectura del frontend debe permitir reemplazar fácilmente estas implementaciones por endpoints reales.

El objetivo es que la lógica de negocio del frontend no dependa directamente de:

* URLs de endpoints.  
* Formatos internos de respuestas.  
* Librerías HTTP específicas.

---

# **80\. Arquitectura recomendada de acceso a datos**

Se recomienda separar claramente las responsabilidades.

Ejemplo de estructura:

src/  
│  
├── api/  
│   ├── client.ts           \# Configuración de HTTP client (axios/fetch)  
│   ├── endpoints.ts        \# Definición centralizada de rutas  
│   ├── errors.ts           \# Clasificación de errores  
│  
├── services/  
│   ├── users.service.ts  
│   ├── records.service.ts  
│   ├── workplaces.service.ts  
│   ├── clients.service.ts  
│   ├── documents.service.ts  
│   └── timesheets.service.ts  
│  
├── hooks/  
│   ├── queries/  
│   ├── mutations/  
│  
├── types/  
│   ├── api.types.ts  
│   ├── domain.types.ts  
│  
└── mocks/  
    └── fake-data.ts

---

## 80.1 Responsabilidad de cada capa

**API Client**

Responsable de:

* Configurar la comunicación HTTP.  
* Incluir tokens de autenticación.  
* Manejar renovación de sesión.  
* Interceptar respuestas de error.  
* Aplicar configuraciones globales.

---

**Services**

Cada servicio representa un dominio del sistema.

Ejemplos:

* Usuarios.  
* Registros.  
* Clientes.  
* Lugares de trabajo.  
* Planillas.  
* Documentos.

Sus responsabilidades:

* Llamar endpoints.  
* Transformar DTOs si fuera necesario.  
* Exponer funciones claras al resto de la aplicación.

Ejemplo:

usersService.getUsers(filters)

recordsService.updateRecord(recordId, data)

---

**React Query Hooks**

Los componentes de la UI nunca deberían consumir directamente los servicios.

Se recomienda encapsularlos mediante hooks:

Ejemplo:

const {  
  data,  
  isLoading,  
  error  
} \= useUsersQuery(filters);

Beneficios:

* Manejo automático de cache.  
* Loading y errores estandarizados.  
* Invalidaciones centralizadas.  
* Reutilización de lógica.

---

# **81\. Convenciones generales de la API REST**

Aunque el backend todavía no está implementado, se recomienda seguir principios REST.

Ejemplos:

**Recursos**  
/users  
/records  
/clients  
/sites  
/workplaces  
/timesheets  
/documents  
/auth

---

**Acciones comunes**

**Obtener listado**  
GET /users

---

**Obtener detalle**  
GET /users/{id}

---

**Crear**  
POST /users

---

**Actualizar**  
PUT /users/{id}

o:

PATCH /users/{id}

La decisión final dependerá del backend.

---

**Desactivar**

Ejemplo:

PATCH /users/{id}/status

---

# **82\. Convención de paginación**

Todos los listados grandes utilizarán paginación server-side.

La API debería recibir parámetros similares:

GET /users?page=1\&pageSize=25

Respuesta sugerida:

{  
  "items": \[\],  
  "pagination": {  
    "page": 1,  
    "pageSize": 25,  
    "totalItems": 250,  
    "totalPages": 10  
  }  
}

---

# **83\. Convención de filtros y ordenamiento**

Los filtros deben ser explícitos en la URL.

Ejemplo:

GET /records?  
month=5&  
year=2026&  
siteId=123&  
employeeId=456&  
status=INCOMPLETE

Ordenamiento:

GET /users?sortBy=lastName\&order=asc

---

# **84\. Infinite scroll para registros**

El módulo de registros tiene un comportamiento diferente al resto del sistema.

No utilizará paginación visual.

El frontend realizará consultas paginadas internamente:

Ejemplo:

GET /records?page=1\&pageSize=50

Al llegar al final de la tabla:

* Se solicita la página siguiente.  
* Los nuevos resultados se agregan al listado actual.  
* La experiencia debe sentirse como una tabla continua.

Se recomienda utilizar:

useInfiniteQuery()

de React Query.

---

# **85\. Formato general de respuestas exitosas**

No es obligatorio, pero se recomienda una estructura consistente.

Ejemplo:

{  
  "data": {  
    "id": "123",  
    "name": "Juan Perez"  
  }  
}

Para listados:

{  
  "data": \[\],  
  "pagination": {}  
}

El formato final dependerá del backend.

---

# **86\. Formato general de errores**

Debe existir un contrato uniforme de errores.

Ejemplo:

{  
  "error": {  
    "code": "USER\_ALREADY\_EXISTS",  
    "message": "El usuario ya existe",  
    "retryable": false  
  }  
}

---

**Consideraciones importantes**

El frontend no debe depender únicamente del campo `retryable`.

Debe mantener su propia configuración de errores reintentables basada en:

* Status HTTP.  
* Reglas internas configurables.

Esto permite desacoplar la aplicación de cambios en el backend.

---

# **87\. Validaciones**

Las validaciones deben existir en dos niveles.

**Frontend**

Responsable de:

* Mejorar la experiencia de usuario.  
* Validar formatos básicos.  
* Evitar solicitudes claramente inválidas.

Ejemplos:

* Email válido.  
* Campos obligatorios.  
* Longitud mínima de contraseñas.  
* Tamaño y tipo de archivos.

---

**Backend**

Responsable de:

* Validación definitiva.  
* Reglas de negocio.  
* Permisos.  
* Integridad de datos.

Ejemplo:

Aunque el frontend valide que un DNI no exista, el backend debe verificarlo nuevamente.

---

# **88\. Modelos TypeScript**

Se recomienda separar:

**DTOs de API**

Representan exactamente lo que viaja por la red.

Ejemplo:

interface UserResponseDto {  
  id: string;  
  firstName: string;  
  lastName: string;  
  email: string;  
}

---

**Modelos de dominio**

Representan los conceptos utilizados dentro del frontend.

Ejemplo:

interface User {  
  id: string;  
  fullName: string;  
  email: string;  
}

Esto permite que cambios en la API afecten la menor cantidad posible de código.

---

# **89\. Enums centralizados**

Todos los estados del sistema deben definirse en un único lugar.

Ejemplo:

src/constants/enums.ts

Ejemplos:

enum UserRole {  
  EMPLOYEE,  
  ADMIN,  
  SUPER\_ADMIN  
}

enum RecordStatus {  
  COMPLETE,  
  INCOMPLETE  
}

enum ReviewStatus {  
  NONE,  
  PENDING,  
  APPROVED,  
  REJECTED,  
  MANUAL\_LOADED  
}

También deben existir:

* IntervalStatus.  
* IntervalType.  
* AccountStatus.  
* TimesheetStatus.  
* DocumentType.  
* RecordOrigin.  
* Site.

---

# **90\. Gestión de formularios**

Se recomienda utilizar una librería especializada.

Ejemplo:

* React Hook Form.

Combinado con:

* Zod o una librería similar para validaciones.

Beneficios:

* Menos renders.  
* Mejor performance.  
* Validaciones tipadas.  
* Reutilización de esquemas.

---

# **91\. Componentes reutilizables**

Se recomienda construir una librería interna de componentes.

Ejemplos:

**Inputs**

* TextInput.  
* Select.  
* DatePicker.  
* FileUploader.

---

**Visualización**

* Table.  
* Badge de estado.  
* Card de métricas.  
* EmptyState.  
* ErrorState.  
* Skeleton.

---

**Interacción**

* Modal.  
* Dialog de confirmación.  
* Toast.  
* Tooltip.

---

El objetivo es mantener una interfaz consistente y facilitar futuros cambios visuales.

---

# **92\. Manejo de estados globales**

La aplicación debe evitar utilizar un store global grande para información de servidor.

La regla general:

Datos del servidor:

* React Query.

Estado de interfaz:

* Estado local de React.  
* Context API cuando tenga sentido.

Ejemplos de estado global aceptable:

* Usuario autenticado.  
* Tema de la aplicación (a futuro).  
* Configuraciones generales.

---

No se recomienda introducir Redux u otras soluciones complejas en el MVP salvo que surja una necesidad real.

---

# **93\. Estrategia de desarrollo inicial**

Durante las primeras etapas, se recomienda desarrollar utilizando mocks.

Ejemplo:

UI  
 ↓  
React Query  
 ↓  
Services  
 ↓  
Mock Service

Luego reemplazar:

Mock Service

por:

HTTP API real

sin necesidad de modificar:

* Componentes.  
* Hooks.  
* Lógica de interfaz.

---

# **94\. Testing recomendado**

El MVP no requiere una estrategia de testing extremadamente compleja.

Se recomienda priorizar:

**Tests unitarios**

Para:

* Funciones utilitarias.  
* Transformaciones de datos.  
* Validaciones.

---

**Tests de componentes críticos**

Ejemplos:

* Formularios.  
* Tabla de registros.  
* Flujos de edición.

---

**Tests de integración**

Especialmente para:

* Comunicación con APIs.  
* Mutations de React Query.  
* Flujos de autenticación.

---

# **95\. Preparación para evolución futura**

La arquitectura debe facilitar futuras incorporaciones, por ejemplo:

* Nuevos roles y permisos.  
* Auditoría visible.  
* Nuevos módulos administrativos.  
* Integración en tiempo real.  
* Mayor volumen de empleados.  
* Nuevos tipos de documentos.  
* Nuevas métricas y dashboards.  
* Nuevos estados de negocio.

La primera versión debe mantener simplicidad, pero evitando decisiones que dificulten la evolución del sistema.

