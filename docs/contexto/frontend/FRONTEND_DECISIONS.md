# Registro de decisiones del frontend

## Propósito

Este archivo separa decisiones confirmadas, propuestas técnicas y asuntos que requieren aprobación. Debe actualizarse cuando exista evidencia de una decisión del equipo o de la Asociación.

## Establecido como propuesta en el anteproyecto y la Hoja V3

| Decisión | Consecuencia para el frontend |
|---|---|
| Aplicación web en React | El cliente se diseñará como aplicación web modular, sujeto a la aprobación final del proyecto. |
| Interfaz responsiva | Formularios y consultas deben adaptarse a los tamaños aprobados. |
| Acceso por roles, permisos y ámbito | La navegación y las acciones se presentan según capacidades. |
| API y datos centralizados | El cliente no accede directamente a PostgreSQL ni al almacenamiento. |
| Información sensible | Se aplica minimización de datos y separación por área. |
| Sin borrado físico desde la aplicación | La interfaz usa inactivación, anulación y restauración. |
| Consulta, impresión y descarga separadas | Cada acción requiere capacidad independiente. |
| Sistema visual institucional | Usar Inter, la paleta morada y la escala tipográfica ampliada definidas en `FRONTEND_DESIGN_SYSTEM.md`. |
| Escala visual ampliada | Priorizar texto de 18 px, títulos de 42 px, controles de 56 px y aprovechamiento del ancho de escritorio. |
| Hardware institucional de referencia | Optimizar y validar los flujos críticos para equipos con 6 GB de RAM y AMD A8-7410 APU con AMD Radeon R5 Graphics. |
| Tarjetas en formularios | Se permiten para agrupar apartados completos; se evita una tarjeta por campo y la anidación innecesaria. |

## Propuestas técnicas por aprobar

| Código | Propuesta | Motivo | Estado |
|---|---|---|---|
| FD-01 | TypeScript estricto | Reducir inconsistencias en formularios y contratos | Pendiente |
| FD-02 | Vite | Entorno sencillo de desarrollo y compilación | Pendiente |
| FD-03 | React Router | Rutas modulares y protegidas | Pendiente |
| FD-04 | TanStack Query | Manejo de estado remoto, caché e invalidación | Pendiente |
| FD-05 | React Hook Form y Zod | Formularios extensos con validación tipada | Pendiente |
| FD-06 | Vitest, Testing Library y Playwright | Verificación por niveles | Pendiente |
| FD-07 | Arquitectura por funcionalidades | Mantener límites entre módulos | Propuesta base |

## Decisiones institucionales que afectan al frontend

| Pendiente | Impacto |
|---|---|
| PV1: matriz RBAC, roles múltiples, practicantes y Guardería | Menús, rutas, acciones y ámbitos visibles |
| PV2: campos, catálogos y reglas de la ficha | Formularios, validaciones y representación impresa |
| PV3: autenticación adicional y tiempos | Activación, inicio de sesión, expiración y recuperación |
| PV4: proveedor y límite de archivos | Carga, progreso, mensajes y cuotas visibles |
| PV5: lector de huella | Interfaz de movimientos, errores y método alternativo |
| PV6: capacidad y rendimiento | Paginación, búsqueda, límites y pruebas de carga del cliente |
| PV7: equipos y alcance móvil | Puntos de quiebre, navegadores y funciones móviles |
| PV8: reglas del albergue y menores | Validaciones de ingreso, espacio, salida y egreso |
| PV9: indicadores | Filtros, etiquetas, agrupaciones y exportaciones |
| PV10: operación y mantenimiento | Pantallas o mensajes relacionados con incidentes y mantenimiento |
| PF1: obligatoriedad y catálogos de formularios de área | Esquemas, campos condicionales y completitud |
| PF2: formato institucional de impresión | Diseño del documento que se imprimirá y firmará físicamente |
| PF3: abreviaturas, unidades y reglas clínicas | Etiquetas, controles y validaciones médicas |

## Cambios posteriores a la Hoja V3 en la matriz de trabajo

- Se retira el rol de Practicante.
- La Directora consulta datos generales, áreas, albergue y expediente completo; puede imprimir el expediente completo. No tiene acciones de creación, edición, inactivación o administración.
- La coordinación de Guardería utiliza el rol existente de Coordinador de área con ámbito Guardería. Se agrega Trabajadora de Guardería para los casos de esa área.
- Se agregan Digitalizador de ficha inicial y Digitalizador de área. El primero registra la ficha inicial; el segundo registra contenido y documentos del área asignada. Ambos pueden agregar anotaciones de seguimiento sin sobrescribir las anteriores.
- Administración general es responsable de inactivar y restaurar expedientes, con motivo obligatorio y registro en bitácora. RF-ED10 debe actualizarse porque la Hoja V3 asignaba esta acción a Dirección.
- Todas las cuentas pueden cerrar sesión. El restablecimiento de contraseña está disponible para cuentas con correo institucional.
- Administración general administra la habilitación o configuración del segundo factor, las categorías de ficha inicial y la consulta del historial de accesos. El mecanismo concreto del segundo factor continúa sujeto a `PV3`.
- La consulta del historial de modificaciones se concede a Dirección y Administración general en modo lectura y a las coordinaciones dentro de su ámbito.
- La descarga documental se divide en documentos generales y documentos específicos del área; cada acción conserva una capacidad independiente.
- La anulación de documentos corresponde a las coordinaciones dentro de su área. Anular conserva el documento y su historial.
- Administración general puede exportar reportes institucionales; las coordinaciones exportan reportes de su área o ámbito.
- La matriz vigente define, para cada formulario, quién puede crear, consultar, corregir, confirmar e imprimir.
- Existe una hoja evolutiva o bitácora por área. Psicología tiene hoja evolutiva psicológica y Trabajo Social vincula sus seguimientos con la ficha social.
- La corrección de una nota se ofrece como edición, conservando auditoría de la versión anterior.
- Cada profesional consulta la hoja de su área. La Directora reúne las hojas de todas las áreas al consultar o generar el expediente completo, sin modificarlas.
- Hijas e hijos se registran y relacionan desde la ficha inicial. Las áreas reutilizan esos registros; un nacimiento ocurrido durante una estancia activa puede agregarse desde Albergue y se incorpora automáticamente al expediente y a la ficha inicial.
- La base de datos usa `cui`; la interfaz presenta la etiqueta “DPI/CUI”.
- Una firma física no bloquea cambios posteriores. Toda modificación posterior conserva historial y autoría.
- Cada área consulta únicamente sus documentos digitales. La Directora puede consultarlos dentro del expediente completo. La entrega a otra área se realiza mediante descarga o impresión por el área propietaria.
- “Dar de alta” equivale al egreso definitivo del Albergue. Ingreso, salida temporal, retorno y egreso son movimientos distintos.
- Cualquier integrante autorizado del personal de Albergue puede registrar salidas temporales.
- El panel y los reportes muestran la cantidad de personas activas, separando beneficiarias de hijas, hijos o infantes; no se administran camas ni habitaciones.
- El backend bloquea un nuevo ingreso cuando el CUI ya tiene una estancia `ACTIVO`.
- En Guardería, “número de proceso de la madre” corresponde al número de la ficha inicial.
- La ficha inicial conserva los 19 apartados institucionales y el bloque de riesgo en un único borrador, repartido en páginas cortas para reducir el desplazamiento vertical.
- La ficha inicial no captura una edad declarada separada; usa `fecha_nac` conforme al modelo actual.
- Ocupación, país, departamento y municipio se seleccionan de los catálogos existentes. Los combos geográficos son dependientes y persisten las claves foráneas del diagrama.
- Las referencias internas y externas se presentan como grupos de casillas porque admiten selección múltiple.
- Cada entrada de hoja evolutiva exige registrar y mostrar la acción realizada mediante `hoja_evolutiva.accion`.
- La fecha de registro de una entrada evolutiva se completa automáticamente en la zona `America/Guatemala`; el usuario no la modifica y el backend conserva la marca de tiempo autoritativa.
- La lista de acciones del consolidado se conserva como candidata para `hoja_evolutiva.accion`, pendiente de confirmar como catálogo definitivo.
- **Pendiente:** confirmar si Administración general preparará, consultará o imprimirá el informe consolidado, además de definir contenido, permisos y contrato.
- **Propuesta técnica si se aprueba:** contar entradas de `hoja_evolutiva` por acción, área y período, sin selección manual en el informe; calcular la edad desde `fecha_nac`.

Estos cambios constan en la [matriz de permisos de trabajo](https://docs.google.com/spreadsheets/d/1pi03rXqpIT49Sif7QZjsuQ8z1aox4QPICrB4Hp4DXpI/edit). Se debe actualizar la matriz RBAC y los requisitos afectados en el documento V3 para mantener una sola línea base antes de implementar autorización en frontend y backend.

## Preguntas técnicas por resolver al iniciar el repositorio

- ¿La plantilla React ya fue adquirida y qué librería visual utiliza?
- ¿El frontend y backend vivirán en un monorepositorio o en repositorios separados?
- ¿Cuál será el formato definitivo de errores y paginación de la API?
- ¿Cómo entregará el backend las capacidades y ámbitos de la sesión?
- ¿Qué mecanismo aprobado se utilizará para autenticación y renovación de sesión?
- ¿Qué navegadores y tamaños se incluirán en la aceptación final?
- ¿Se requiere internacionalización o toda la interfaz permanecerá en español?
- ¿Qué componentes de tablas, fechas, gráficos y PDF permite la licencia de la plantilla?

## Reglas para actualizar este archivo

Toda decisión nueva debe incluir fecha, responsable o fuente y efecto sobre el frontend. Una propuesta cambia a aprobada únicamente cuando exista validación del responsable correspondiente. Si una decisión aprobada cambia, se conserva el motivo y la decisión anterior en el historial del proyecto.

## Actualización del esquema unificado v2 - 24 de octubre de 2026

- Existe `expediente` como contenedor uno a uno de la beneficiaria.
- `ficha_inicial` y `nino` pasan a vincularse por `expediente_id` y ya no por `beneficiaria_id` directo tras aplicar la ampliación.
- `formulario_area` es la cabecera común para Psicología, Trabajo Social, Medicina, Legal y Guardería, con sujeto, área, tipo, estado, profesional, capturista, versión e identidad histórica.
- Se incorporan detalles tipados, `entrada_evolutiva`, `documento_area`, `estancia_nino`, `movimiento_nino` y `revision_registro`.
- El DDL calcula la edad a la fecha de atención en `v_identidad_formulario`; se mantiene la decisión de no almacenar edad declarada.
- La ampliación está revisada estáticamente y pendiente de ejecutarse en PostgreSQL de ensayo. No debe considerarse desplegada hasta verificarla.
