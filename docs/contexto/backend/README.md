# Contexto de backend de Nuevos Horizontes

Este directorio define la base funcional y técnica para implementar el backend del sistema de gestión de beneficiarias, expedientes, formularios por área y Albergue. La plataforma definida es **NestJS con PostgreSQL**, implementada como **monolito modular con MVC adaptado a una API REST**. El diseño parte de los requisitos, la matriz de roles vigente, el diagrama preliminar de datos y los formularios ya consolidados.

## Orden de lectura

1. `AGENTS.md`: reglas obligatorias para trabajar en el backend.
2. `BACKEND_DECISIONS.md`: decisiones confirmadas, propuestas y pendientes.
3. `BACKEND_ARCHITECTURE.md`: módulos, capas y dependencias.
4. `BACKEND_DOMAIN_MODEL.md`: agregados, relaciones e invariantes.
5. `BACKEND_SCHEMA_V2.md`: estructura observada en la ampliación SQL unificada y cautelas de ejecución.
6. `BACKEND_DATABASE.md`: diseño PostgreSQL, migraciones, restricciones e índices.
7. `BACKEND_AUTHORIZATION.md`: autenticación, roles, capacidades y ámbitos.
8. `BACKEND_API.md`: convenciones HTTP y contratos.
9. `BACKEND_WORKFLOWS.md`: transacciones y máquinas de estado.
10. `BACKEND_DOCUMENTS.md`: almacenamiento, versiones, descarga, impresión y anulación.
11. `BACKEND_AUDIT_SECURITY.md`: bitácoras y protección de datos.
12. `BACKEND_REPORTING.md`: indicadores y exportaciones.
13. `BACKEND_TESTING_OPERATIONS.md`: pruebas, observabilidad, respaldos y despliegue.
14. `BACKEND_TRACEABILITY.md`: requisitos, módulos y evidencia esperada.
15. `BACKEND_IMPLEMENTATION_PLAN.md`: secuencia recomendada de entrega.

## Fuentes de contexto

- Anteproyecto del sistema modular de Nuevos Horizontes.
- Hoja de Requerimientos V3.
- Matriz vigente de roles y permisos, con correcciones posteriores a la V3.
- Diagrama unificado v2 `D_diagrama_unificado.pdf` y ampliación `02_ampliacion_formularios.sql` del 24 de octubre de 2026.
- Demostración aislada `00_demo_formularios_aislado.sql`, que no modifica el esquema principal.
- Inventario institucional de formularios y decisiones consolidadas en `../contexto-frontend/FRONTEND_FORMS.md` y `FRONTEND_DATA_MODEL.md`.
- Mockups funcionales disponibles en `../`.

La matriz vigente reemplaza la asignación de permisos de la V3 cuando exista contradicción. La ampliación v2 concreta expedientes, formularios de área, evolución, documentos, estancias infantiles y revisiones, pero declara estar pendiente de ejecución en PostgreSQL de ensayo. Solo la migración aplicada y verificada puede considerarse fuente de verdad operacional.

Esta advertencia se refiere al DDL unificado v2, no a las migraciones
específicas de Persona 1 agregadas posteriormente en `database/migrations/`.
El estado comprobado de esas migraciones y del código actual está en
`../../ESTADO_TECNICO_ACTUAL.md`.

## Convenciones de estado

- **Confirmado:** regla institucional que el servidor debe aplicar.
- **Propuesta técnica:** recomendación reemplazable sin cambiar la regla institucional.
- **Pendiente:** requiere aprobación o evidencia adicional; no debe implementarse como regla definitiva.

## Alcance

Incluye API, persistencia, autorización, auditoría, documentos, reportes y operación. No define estilos de interfaz. Los ejemplos nunca deben contener datos reales de beneficiarias.

Estado: borrador técnico actualizado con el esquema unificado v2. Fecha de referencia: 24 de octubre de 2026.


