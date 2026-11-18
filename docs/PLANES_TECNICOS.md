# Planificación técnica y estado de módulos

Este documento concentra planes de reconstrucción y estado técnico de módulos.
No crear planes, inventarios ni cierres por área; actualizar la fila aplicable
y registrar la publicación en `HISTORIAL_DOCUMENTAL.md`.

## Estado actual

| Tema | Estado técnico | Siguiente trabajo permitido |
| --- | --- | --- |
| Social | Cuenta con módulo backend y frontend propios, consultas TypeORM, ficha, listado, resumen, borrador, confirmación, descarte y vínculo dirigido a Documentos. | Mantener contratos y pruebas; la escritura de hoja evolutiva, riesgos estructurados y reglas institucionales sólo avanzan al resolver D-04 y D-05. |
| Legal | Variante propia integrada sobre el motor común de formularios. | Revisar operaciones simples de persistencia conforme a D-09, sin modificar contratos ni reglas institucionales no confirmadas. |
| Guardería | Cuenta con módulos propios y estructuras para responsables autorizados y paternidad. | Verificar el estado real de las migraciones 010 y 011 antes de desplegar; no ampliar permisos ni relaciones familiares sin decisión confirmada. |
| Documentos | El módulo común conserva carga, versión, anulación y asociación por formulario. | Resolver D-03 antes de asumir almacenamiento, enlaces, antivirus o ciclo de vida de producción. |
| Autenticación y autorización | Sólo hay contexto técnico de desarrollo; no equivale a sesión productiva. | Esperar resolución D-02; no introducir permisos o identidades inferidos. |

## Convenciones para reconstrucción o mejora

- Conservar rutas, contratos públicos, paginación, control de versión y
  respuestas de error salvo decisión explícita que los cambie.
- Mover persistencia simple a repositorios TypeORM; conservar SQL parametrizado
  sólo si JSONB, CTE, bloqueos, funciones PostgreSQL o proyecciones complejas lo
  justifican. Registrar la justificación por código y prueba, no en un informe nuevo.
- Extraer interfaces públicas para leer datos de otro módulo; no importar sus
  repositorios privados ni duplicar sus consultas.
- Mantener auditoría y datos relacionados dentro de la transacción que realiza
  la mutación. Los contextos de ensayo no son sustitutos de autorización real.
- Toda brecha de modelo, campo, estado, permiso o regla se registra como `D-XX`
  en `DECISIONES_Y_DUDAS.md` y se consulta al equipo antes de implementarse.

## Criterios de cierre técnico

Un módulo sólo puede declararse listo para integración cuando conserva sus
contratos, tiene pruebas pertinentes, compila, no depende de datos reales ni de
un ambiente local abierto, y sus migraciones o dependencias externas se han
verificado para el ambiente destino. La publicación se registra en el historial;
la disponibilidad de producción requiere además las decisiones operativas
pendientes.
