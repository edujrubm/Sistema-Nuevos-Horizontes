# Integración con la base existente y NestJS

## Antes de convertirlo en migración real

1. Obtener DDL de PostgreSQL o archivo fuente del diagrama, versión de motor y herramienta de migraciones. El PDF no acredita que exista una base desplegada.
2. Comparar las 45 tablas reconstruidas con el DDL: nombres, claves exactas, tipos, nulabilidad y relaciones. En particular, revisar `rol.id_area`, `empleado.rol_id`, `hoja_evolutiva.accion` y el tipo de las fechas de Albergue.
3. Si hay datos, usar una copia de trabajo anonimizada y respaldo verificable. Revisar hijos huérfanos, fichas de otra beneficiaria, CUI duplicados y estancias abiertas duplicadas antes de crear restricciones.
4. Conservar las tablas actuales y adaptar la ampliación al esquema real. No ejecutar la reconstrucción ni crear otro juego de beneficiarias en producción. Si las claves reales son integer o UUID, ajustar todas las referencias de la ampliación.
5. Añadir las claves únicas compuestas `(id_ficha_inicial,beneficiaria_id)` y `(nino_id,beneficiaria_id)` necesarias para los vínculos seguros, después de validar sus datos.
6. Cargar/relacionar áreas sin duplicarlas: la inserción de áreas de `002` asume la reconstrucción vacía. En producción usar correspondencias por ID existente y una migración idempotente de catálogos.
7. Crear nuevas tablas y controles, cargar únicamente catálogos aprobados, ensayar los nueve tipos de formulario y verificar conteos. Conservar el sistema anterior hasta reconciliar lecturas y escrituras.
8. Migrar notas antiguas con una tabla de correspondencias y claves de origen únicas. Si el JSON legado contiene varias notas, descomponerlo tras inspeccionar su estructura, conservando una copia y el ID original. No inventar fechas, autores ni acciones faltantes; registrar incidencias para revisión.

## Flujo de escritura desde NestJS

Usar módulos de Psicología, Social, Medicina, Legal, Guardería y Albergue con un servicio común de registros de área y evolución. Los DTO incluyen la variante concreta y campos explícitos; el frontend no envía CUI/nombre como sustitutos de IDs.

En una única transacción:

1. Autenticar y autorizar crear/corregir según capacidad, área, caso y estado. El área se resuelve desde el tipo, no se confía en el cuerpo del cliente. Verificar también profesional/capturista y su habilitación.
2. Establecer contexto de auditoría mediante `SELECT set_config('nh.actor_id', $1, true)` y `set_config('nh.motivo', $2, true)`. El usuario se obtiene de la sesión verificada. Para creación usar motivo `Registro inicial`; los detalles tocan cabecera y generan versiones auditadas.
3. Para editar, bloquear primero la cabecera con `SELECT ... FOR UPDATE`, comparar la versión enviada (`If-Match`) y rechazar con conflicto si cambió. No editar bloques sin ese bloqueo y comparación. Una nota también compara su versión.
4. Crear cabecera y detalle juntos. La validación diferida exige detalle al finalizar. Cargar contexto y familiares solo cuando corresponden; confirmar que los datos vinculados son del mismo expediente.
5. Al confirmar, validar obligatoriedad aprobada y crear la fotografía mínima de identidad. Guardar nota evolutiva solo si la operación representa una atención/seguimiento, no por cualquier cambio de campos.
6. Confirmar la transacción y devolver la versión final. Una falla revierte formulario, notas e historial conjuntamente.

El backend debe exigir una clave de idempotencia para crear formularios y movimientos; la ampliación solo trae unicidad de origen para notas migradas. Añadir una tabla de idempotencia de solicitudes en la implementación de API.

## Lecturas y seguridad

Las FK evitan vínculos inválidos pero no conceden permisos de lectura. Toda consulta debe filtrar por ámbito, caso y área desde el servidor. Dirección reúne el expediente autorizado en modo consulta/impresión. Un permiso de consulta no concede descarga. No se implementa el consolidado de Administración general sin confirmación.

No usar el propietario de las tablas como cuenta habitual del servicio. Crear roles limitados y otorgar permisos concretos; el esquema no crea usuarios ni contraseñas. La cuenta del backend necesitará permisos de lectura/INSERT en la auditoría para los triggers y no UPDATE/DELETE allí. Probar esas concesiones con la cuenta real. La política de seguridad por filas no está implementada y la configuración `nh.actor_id` no autentica a quien ejecuta SQL.

Los documentos son privados, con validación de MIME/tamaño y checksum. La cadena de versiones debe ser lineal y consecutiva en el servicio bajo bloqueo. No guardar URLs públicas. Registrar consultas sensibles, impresión, descarga y denegaciones en una bitácora separada minimizada; no copiar diagnósticos a logs técnicos.

## Decisiones que no se deben asumir

| Tema | Definición necesaria |
|---|---|
| Existencia de base real | DDL/migraciones y datos actuales; todavía solo se dispone del diagrama. |
| Estado/confirmación | Catálogo y transiciones de formularios; qué operaciones permite cada estado. |
| Campos obligatorios | Matriz por variante, campos desconocidos/no aplica, longitudes y reglas condicionales. |
| Psicología | Uso de ejes I–V, pruebas y escalas; formatos institucionales y períodos de reevaluación. |
| Familia | Fecha desconocida y edades referidas de terceros; responsables de retiro; autorización y vigencia. |
| Niñez/adolescencia | Tratamiento de beneficiarias adolescentes frente a hijos adolescentes; la propuesta médica adolescente apunta a beneficiaria, no a hijo, hasta conciliarlo. |
| Medicina | HEA, E/F, IC, P/A y W; unidades de peso/talla/temperatura y campos aplicables por variante. |
| Catálogos | Religión, sexo/género, acciones evolutivas y fechas de vigencia de valores. |
| Identidad | Alta sin CUI, deduplicación y unicidad según país/documento; no imponer UNIQUE global sin revisar historia. |
| Firma | Evidencia de firma física, firma de cada nota y requisitos de firma electrónica si se requieren. |
| Legal | Varios demandados/procesos por ficha. La referencia admite múltiples fichas legales, pero cada una conserva un demandado principal; ampliar a tabla puente si el área requiere varios. |
| Albergue | Alternancia de movimientos, responsables, egreso durante salida, cierre de estancias infantiles y corrección de fechas. |
| Auditoría | Protección, retención y acceso al contenido histórico; restauración por nueva revisión. |
| Cuentas | Roles múltiples, ámbitos y asignación por caso; no se resuelven ampliando solo los formularios. |

## Cómo se relaciona con los Markdown anteriores

Los documentos previos describían formularios de área sin columnas definitivas y dejaban pendiente el sujeto infantil de Albergue. Este paquete concreta una propuesta con `formulario_area`, detalles tipados y `nino_id` controlado. No convierte propuestas clínicas, estados ni catálogos en decisiones aprobadas. Mantener esta carpeta junto a los paquetes existentes y referenciarla como propuesta de unificación de fecha 24/10/2026 antes de integrar al repositorio.
