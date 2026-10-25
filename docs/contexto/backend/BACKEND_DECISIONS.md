# Registro de decisiones del backend

## Confirmado por el proyecto

| Tema | Decisión |
|---|---|
| Plataforma | Backend en NestJS y persistencia en PostgreSQL. |
| Patrón arquitectónico | Monolito modular con MVC adaptado a API REST; cada módulo separa Model, View de respuesta, Controller y servicios. |
| Arquitectura externa | El frontend React consume una API; nunca accede directamente a PostgreSQL ni al almacenamiento. |
| Autorización | Denegación predeterminada; rol, capacidad, área/caso y vigencia se evalúan en servidor. |
| Identidad | La base usa `cui`; no existe edad declarada independiente. |
| Ficha inicial | Una sola ficha/borrador, con 19 apartados y bloque de riesgo. |
| Familia | Hijas e hijos se vinculan desde la ficha inicial; nacimiento en estancia activa es la excepción operada por Albergue. |
| Áreas | Psicología, Trabajo Social, Medicina, Legal y Guardería conservan formularios y documentos separados. |
| Evolución | Existe hoja por área; cada entrada contiene acción obligatoria y fecha automática. |
| Documentos | Acceso por área; Dirección consulta el expediente completo; anular no elimina. |
| Albergue | Ingreso, salida temporal, retorno y egreso son distintos; no hay camas/habitaciones en esta etapa. |
| Eliminación | Se usan inactivación, restauración, anulación y versionado; no borrado físico de información institucional. |
| Auditoría | Cambios, accesos sensibles y operaciones administrativas requieren trazabilidad. |
| Zona horaria | La operación institucional se interpreta en `America/Guatemala`. |

## Propuestas técnicas base

| Código | Propuesta | Justificación |
|---|---|---|
| BD-01 | Organización interna por módulos de dominio dentro del monolito MVC | Mantiene límites funcionales y transacciones sin separar despliegues. |
| BD-02 | API REST bajo `/api/v1` | Contrato explícito y simple para formularios y reportes. |
| BD-03 | TypeScript estricto | Evita contratos implícitos y valores nulos accidentales. |
| BD-04 | Adaptadores de repositorio | Evita acoplar dominio y casos de uso a un ORM específico. |
| BD-05 | OpenAPI generado desde DTO y ejemplos sanitizados | Facilita integración y revisión contractual. |
| BD-06 | Auditoría transaccional y outbox para efectos externos | Evita cambios sin bitácora y permite reintentos. |
| BD-07 | Almacenamiento de archivos privado fuera de PostgreSQL | PostgreSQL conserva metadatos, versiones, checksum y autorización. |
| BD-08 | Control optimista con `version` y `If-Match` | Detecta ediciones concurrentes sin sobrescritura silenciosa. |
| BD-09 | Claves de idempotencia en mutaciones críticas | Protege contra doble envío en confirmaciones, ingresos y movimientos. |
| BD-10 | Pruebas de integración contra PostgreSQL real | Verifica restricciones, bloqueos, consultas e índices reales. |

## Pendiente de decisión

1. ORM y herramienta de migraciones: Prisma, TypeORM u otra. Evaluar transacciones, bloqueo pesimista, migraciones SQL e introspección; no elegir por costumbre.
2. Versión exacta de Node.js y NestJS; usar una versión LTS soportada al iniciar el repositorio.
3. Proveedor de identidad, mecanismo de segundo factor, duración de sesiones y política de contraseñas.
4. Modelo exacto para cuentas con múltiples roles y ámbitos; el campo preliminar `empleado.rol_id` no cubre el requisito.
5. Identificador primario definitivo (`uuid`, `bigint` u otro) y estrategia para correlativos visibles.
6. Proveedor de objetos/documentos, tamaños, extensiones permitidas, antivirus y conservación.
7. Obligatoriedad, catálogos y tipos de los formularios de área.
8. Estados definitivos de ficha, documento, estancia y expediente.
9. Catálogo definitivo de acciones evolutivas; la lista del consolidado solo es candidata.
10. Indicadores, período y formato de reportes.
11. Informe consolidado de Administración general: permanece fuera de alcance hasta aprobación.
12. Alta disponibilidad, RPO, RTO, volumen esperado y política legal de retención.

Una decisión pendiente debe quedar detrás de una interfaz reemplazable o fuera de la entrega. No se deben inventar valores definitivos en migraciones o enums.

## Decisiones materializadas en el DDL unificado v2

- `expediente` es el contenedor uno a uno de la beneficiaria.
- `ficha_inicial` y `nino` se vinculan por `expediente_id` después de aplicar la ampliación.
- `formulario_area` es la cabecera común y los detalles de área son tablas tipadas.
- Psicología tiene variantes mujer/niñez y examen mental; Medicina usa un detalle común para tres tipos; Social, Legal, Referencia Legal y Guardería tienen detalles propios.
- `entrada_evolutiva` exige acción y contenido y admite origen idempotente.
- `documento_area` guarda metadatos privados, checksum, encadenamiento de versiones y anulación.
- `estancia_nino` y `movimiento_nino` amplían Albergue para hijos vinculados al expediente.
- `revision_registro` y los disparadores introducen auditoría, motivo de corrección, versión e impedimento de borrado para las tablas nuevas contempladas.

Estas decisiones corresponden al DDL propuesto. Su estado operativo continúa pendiente hasta ejecutar la migración en PostgreSQL de ensayo.

