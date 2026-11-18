# Integración de módulos

Esta guía sustituye informes de integración por área. Describe convenciones
vigentes, no una entrega concreta. El detalle de cada publicación se registra
en `HISTORIAL_DOCUMENTAL.md` y el cambio efectivo se verifica en Git.

## Base común

Los módulos de área comparten el transporte HTTP, contrato de errores,
adaptadores de formularios, componentes visuales y mecanismos de auditoría y
versión. Cada módulo conserva sus rutas, repositorios y casos de uso; no debe
importar servicios, repositorios o hooks internos de otra área para reutilizar
una función.

Las lecturas y escrituras simples usan TypeORM conforme a `GUIA_TECNICA.md`.
Las transacciones que cambian cabecera, detalle y auditoría mantienen el mismo
`EntityManager`. Las confirmaciones no sobrescriben borradores abiertos y la
interfaz invalida sólo las consultas necesarias.

## Módulos de área integrados

| Área | Backend | Frontend | Integración y límites |
| --- | --- | --- | --- |
| Social | `src/modules/formularios/social/` | `frontend/src/modules/social/` | Ficha, listado, resumen y borradores usan módulo propio. La hoja evolutiva y riesgos estructurados siguen sujetos a decisiones D-04 y D-05. |
| Legal | `src/modules/formularios/legal/` | `frontend/src/modules/legal/` | Mantiene su variante y contratos del motor de formularios. No debe asumir campos ni estados de otras áreas. |
| Guardería | `src/modules/formularios/guarderia/` | `frontend/src/modules/guarderia/` | Incluye responsables autorizados y paternidad sólo conforme a decisiones registradas. No deducir autorización por parentesco. |

## Base de datos

Las migraciones `010_guarderia_responsables.sql` y `011_padre_nino.sql` forman
parte del repositorio. Su presencia no acredita su ejecución: antes de un
despliegue, revisar respaldo, orden, estado real del ambiente y las decisiones
D-01 y D-04. Nunca activar `synchronize` ni `migrationsRun` para integrar un
módulo.

## Proceso de integración

1. Actualizar la rama desde `main` y comprobar contratos, migraciones y pruebas afectadas.
2. Ejecutar `pnpm run check` y las pruebas de PostgreSQL pertinentes con datos sintéticos.
3. Revisar que no se incluyan secretos, datos reales, dependencias instaladas,
   compilados, ambientes ni bases de ensayo.
4. Confirmar que las decisiones pendientes continúan explícitas y que no se
   presenta una prueba local como despliegue productivo.
5. Registrar la entrega y su push en `HISTORIAL_DOCUMENTAL.md`; no crear un
   informe por módulo ni por pull request.
