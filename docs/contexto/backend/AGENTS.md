# Instrucciones para el backend de Nuevos Horizontes

## Reglas obligatorias

- Leer `BACKEND_DECISIONS.md` antes de convertir una necesidad en código o migración.
- Mantener el monolito modular NestJS con MVC adaptado a API REST: Model para dominio y persistencia, View para representaciones/DTO de salida y Controller para HTTP. Los servicios orquestan casos de uso; los controladores no contienen reglas de negocio ni SQL.
- PostgreSQL es la autoridad de integridad. Las validaciones de DTO mejoran mensajes, pero no reemplazan `FOREIGN KEY`, `UNIQUE`, `CHECK`, transacciones ni bloqueos.
- Autorizar cada solicitud en el servidor por **capacidad, ámbito, caso y estado del recurso**. Denegar de forma predeterminada.
- No inferir acceso solo por el nombre del rol. Resolver asignaciones vigentes y excepciones con fecha de expiración.
- La Directora consulta información autorizada y el expediente completo, y puede imprimirlo; no edita, anula, inactiva ni administra cuentas.
- Administración general inactiva y restaura expedientes con motivo, administra cuentas, segundo factor, categorías y consulta historial de accesos.
- No crear el rol Practicante.
- `Coordinador de área` usa un ámbito; Guardería es uno de esos ámbitos. `Trabajadora de Guardería`, `Digitalizador de ficha inicial` y `Digitalizador de área` son roles vigentes.
- Una consulta no concede impresión ni descarga. Documentos generales y documentos específicos de área tienen capacidades de descarga distintas.
- No borrar físicamente beneficiarias, formularios, entradas evolutivas, documentos, versiones, estancias ni eventos auditables desde la aplicación.
- La anulación conserva contenido, versión, motivo, responsable y fecha.
- Usar `cui` en persistencia y contratos; “DPI/CUI” es una etiqueta del cliente.
- No almacenar `edad_declarada`. Calcular edad desde `fecha_nac` para una fecha de referencia explícita.
- Ocupación y geografía referencian catálogos. No guardar país/departamento/municipio concatenados cuando existan claves.
- Hijas e hijos se originan en la ficha inicial. La única excepción confirmada es un nacimiento durante una estancia activa, creado por Albergue dentro de una transacción que también establece sus vínculos.
- Cada área tiene su hoja evolutiva. Toda entrada exige una acción, autor, área, persona, contenido y fecha/hora autoritativa.
- Una edición visible conserva la versión anterior en auditoría. Una firma física no bloquea futuras correcciones autorizadas.
- Bloquear una segunda estancia activa por persona. No depender de una consulta previa del cliente.
- Registrar ingreso, salida temporal, retorno y egreso como hechos distintos. El egreso cierra definitivamente la estancia.
- No implementar camas o habitaciones en esta etapa.
- No implementar el informe consolidado de Administración general hasta su confirmación.
- No registrar secretos, tokens, contraseñas, relatos, diagnósticos ni contenido documental en logs, trazas, métricas o mensajes de error.
- Fechas persistidas: `timestamptz` en UTC. Fechas mostradas o cortes institucionales: `America/Guatemala`.
- Toda mutación sensible debe producir auditoría dentro de la misma transacción o mediante un outbox transaccional.
- Migraciones aplicadas son inmutables. Una corrección crea una migración nueva.
- Los listados son paginados y las exportaciones grandes se procesan de forma acotada o asíncrona.

## Antes de programar

1. Identificar requisito, actor, capacidad y ámbito.
2. Identificar agregado, invariantes y restricciones de base de datos.
3. Definir DTO, respuesta, errores y efecto de auditoría.
4. Definir casos de acceso denegado, conflicto, reintento y concurrencia.
5. Añadir pruebas que demuestren la regla en PostgreSQL real.

## Condición de terminado

Una función está terminada cuando tiene migración cuando corresponda, autorización en servidor, validaciones, auditoría, manejo de concurrencia, contrato documentado, pruebas pertinentes y trazabilidad. Compilar sin errores no basta.

## Reglas del esquema unificado v2

- Tratar `expediente` como raíz persistente de ficha inicial, hijos y formularios; no volver a usar relaciones directas eliminadas por la ampliación.
- Crear `formulario_area` y su detalle tipado en una sola transacción.
- Antes de escrituras auditadas, fijar actor y motivo mediante `SET LOCAL` en la misma conexión de la transacción.
- No afirmar que el DDL v2 está desplegado hasta contar con ejecución exitosa en PostgreSQL de ensayo.
- Consultar `BACKEND_SCHEMA_V2.md` antes de modificar entidades, repositorios o migraciones.

