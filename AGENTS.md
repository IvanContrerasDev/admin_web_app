# GdeS Admin Web App — contexto para agentes

Aplicación web administrativa (RRHH/gerencia) del ecosistema GdeS: gestión y revisión de registros horarios, empleados, clientes/sites/lugares de trabajo, planillas y legajos. **Sin código aún.**

## Fuente de verdad

`docs/spec_definition.md` es la VERDAD ABSOLUTA (8 partes: dominio, auth/usuarios, registros, geolocalización, planillas, UX, performance, contratos API). Reglas de la propia spec:
- No omitir ninguna regla de negocio.
- Usar los contratos TypeScript de la Parte 8; modificarlos/agregarlos/mejorarlos exige consultar al humano, obligatoriamente.
- Para componentes aislados: primero capa de servicios con mocks, antes de APIs reales.

## Reglas

- Parte del sistema GdeS; contratos entre apps en `../docs/arquitectura/contratos-api.md` (manda sobre supuestos locales).
- Skills del stack en `.agents/skills/` — leerlas antes de implementar.
- Quien trabaja acá es `implementer-admin`, despachado por el leader del repo raíz. Documentar en `../progress/admin/current.md`.
