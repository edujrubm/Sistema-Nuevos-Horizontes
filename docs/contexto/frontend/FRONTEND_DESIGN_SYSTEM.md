# Sistema visual del frontend de Nuevos Horizontes

## Propósito

Este documento establece la identidad visual, la escala tipográfica y las reglas de interacción del frontend. Complementa la arquitectura y los estándares técnicos; los permisos, formularios y reglas de negocio se mantienen en sus documentos especializados.

La interfaz debe percibirse institucional, moderna, clara y respetuosa de la información sensible. Su uso prioritario será en computadoras de escritorio.

## Principios

1. **Claridad antes que decoración:** la información y las acciones deben comprenderse sin capacitación extensa.
2. **Privacidad por defecto:** los listados muestran únicamente información mínima autorizada.
3. **Continuidad visual:** después del ingreso se conservan encabezado y navegación lateral; cambia el área de trabajo.
4. **Acciones explícitas:** usar verbos como “Registrar beneficiaria”, “Guardar cambios”, “Agregar seguimiento”, “Ver perfil” e “Imprimir”.
5. **Accesibilidad práctica:** contraste suficiente, texto legible, foco visible, teclado y errores comprensibles.

## Identidad institucional

### Logotipo

- Usar el logotipo circular oficial en la pantalla de ingreso, el encabezado y los reportes.
- No recortar, deformar, girar ni recolorear.
- Conservar alrededor un espacio mínimo equivalente al 10 % de su ancho.
- Altura: encabezado entre 36 y 44 px; ingreso entre 88 y 112 px; reportes entre 48 y 56 px.
- En espacios reducidos, mostrar el logotipo y “Nuevos Horizontes”; en escritorio, el nombre completo.

### Paleta

| Uso | Token | Color | Aplicación |
|---|---|---|---|
| Primario institucional | `--color-primary-700` | `#5B2A9D` | Botón principal, encabezado, enlace activo e íconos |
| Primario suave | `--color-primary-100` | `#EEE7F7` | Selección y etiquetas suaves |
| Primario muy claro | `--color-primary-50` | `#F8F5FC` | Paneles y áreas secundarias |
| Superficie | `--color-surface` | `#FFFFFF` | Tarjetas, formularios y contenido |
| Lienzo | `--color-canvas` | `#F7F7FA` | Fondo general |
| Texto principal | `--color-text-900` | `#24212A` | Títulos y contenido |
| Texto secundario | `--color-text-600` | `#625D69` | Ayuda, fechas y metadatos |
| Borde | `--color-border` | `#E5E1E9` | Divisores, campos y tablas |
| Éxito | `--color-success` | `#277A53` | Confirmaciones |
| Advertencia | `--color-warning` | `#A56608` | Pendientes o revisión |
| Error | `--color-danger` | `#B42318` | Validación y fallos |
| Dorado institucional | `--color-accent-gold` | `#D7A942` | Detalles de baja frecuencia |

No usar el dorado para acciones críticas, grandes fondos morados saturados, texto blanco sobre morado suave ni solo color para comunicar un estado.

## Tipografía

Fuente principal: `Inter`, con respaldo `Arial, sans-serif`. El peso normal es 400; etiquetas y acciones usan 500 o 600; títulos usan 600 o 700. Las mayúsculas se reservan para siglas.

| Elemento | Tamaño | Peso | Interlineado |
|---|---:|---:|---:|
| Título principal `h1` | 42 px | 700 | 50 px |
| Título de sección o nombre | 27–28 px | 600–700 | 36 px |
| Encabezado de panel o modal | 21–24 px | 600 | 30–32 px |
| Navegación y pestañas | 18 px | 600 | 26 px |
| Texto de cuerpo y formulario | 18 px | 400 | 28–30 px |
| Bitácora y editor de notas | 17–18 px | 400 | 27–29 px |
| Botón | 17 px | 600 | 24 px |
| Etiqueta de campo | 16 px | 600 | 22 px |
| Metadato | 14–16 px | 500–600 | 20–22 px |
| Insignia o estado pequeño | 14–15 px | 600 | 20 px |

Ningún texto operativo será menor de 14 px. Los controles de formulario usan 18 px. El tamaño de 13 px se reserva, de forma excepcional, para información auxiliar no esencial en tablas densas.

## Tokens estructurales

- Diseñar primero desde 1280 px.
- Usar todo el ancho disponible del área de trabajo. En pantallas muy anchas puede aplicarse un máximo entre 1600 y 1720 px; no centrar un formulario estrecho cuando exista espacio útil.
- Usar espaciado basado en 8: 8, 16, 24, 32 y 40 px.
- Tarjetas y paneles: radio de 12 px.
- Campos y botones: radio de 8 px.
- Campos: altura mínima de 56 px.
- Botones principales: altura mínima de 52 px.
- Preferir bordes; usar sombra máxima `0 2px 8px rgba(36, 33, 42, .06)`.

## Estructura posterior al ingreso

### Encabezado

El encabezado fijo mide 82 px y usa `--color-primary-700`.

- Izquierda: logotipo y nombre institucional.
- Centro: título contextual o migas de pan.
- Derecha: notificaciones, identificación de la cuenta y menú.
- Menú de cuenta: “Mi perfil”, “Cambiar contraseña” y “Cerrar sesión”.

### Navegación lateral

En escritorio es fija, mide aproximadamente 290 px, tiene fondo blanco y borde derecho. Cada opción utiliza ícono y texto de 18 px.

Las opciones se construyen según capacidades y pueden incluir Beneficiarias, Registrar beneficiaria, Fichas y expedientes, Seguimiento, Albergue, Reportes, Administración y Auditoría.

La opción activa utiliza fondo `--color-primary-100`, texto `--color-primary-700`, mayor peso y una barra vertical de 3 px.

## Pantalla de ingreso

- Dos columnas en escritorio.
- Columna institucional con fondo `#18171D`, logotipo y nombre.
- Tarjeta blanca de acceso, ancho máximo de 420 px.
- Campos “Correo electrónico” y “Contraseña”.
- Control para mostrar contraseña, recuperación y botón “Ingresar”.
- La recuperación responde de forma neutral sin revelar si existe la cuenta.
- Los errores se muestran junto al campo.

## Beneficiarias

La vista inicial prioriza la búsqueda.

- Título “Beneficiarias” y descripción breve.
- Botón “Registrar beneficiaria” únicamente con capacidad.
- Búsqueda por nombre, código o teléfono, con retardo breve e indicador de carga.
- Filtros secundarios únicamente cuando el dato y el permiso existan.
- “Limpiar filtros” aparece cuando haya filtros activos.

Cada resultado es una fila seleccionable de 76 a 84 px. Puede mostrar nombre, código interno, ubicación general autorizada, estado y fecha del último seguimiento. Nunca expone DPI/CUI, dirección exacta, teléfono, diagnóstico, notas o documentos.

## Perfil de beneficiaria

El perfil es una página completa con ruta de regreso. La cabecera muestra nombre, código, estado y acciones autorizadas.

Las pestañas se muestran según capacidades:

| Pestaña | Contenido |
|---|---|
| Bitácora | Eventos autorizados, agrupados por año |
| Documentos | Archivos del área de la cuenta; la Directora los consulta dentro del expediente completo |
| Información | Datos autorizados del perfil |

La pestaña activa usa morado institucional y borde inferior. La selección se conserva al actualizar o volver de una acción.

Cada área presenta únicamente su hoja evolutiva o bitácora. Psicología usa su hoja evolutiva psicológica y Trabajo Social vincula sus seguimientos con la ficha social.

## Formularios

- Dividir formularios extensos en pestañas o secciones manejables.
- Mostrar como máximo entre 6 y 8 campos antes de un cambio visual de sección.
- Las tarjetas de sección están permitidas para separar apartados del formulario y facilitar el reconocimiento visual. Una tarjeta agrupa varios campos relacionados; no se usa una tarjeta individual para cada campo ni se anidan tarjetas.
- Colocar la etiqueta encima del campo; el placeholder no sustituye la etiqueta.
- Señalar los campos obligatorios y explicar el símbolo al inicio.
- Validar al abandonar el campo y al guardar.
- Mostrar el error junto al campo y explicar cómo resolverlo.
- Usar “Guardar” o “Registrar” como acción primaria y “Cancelar” como secundaria.
- Conservar valores al cambiar de pestaña o ante fallos recuperables.
- No ocultar ni borrar silenciosamente valores condicionales.

## Tablas, estados y documentos

- Evitar encerrar cada dato o indicador en una tarjeta independiente. Las tarjetas sí pueden representar secciones completas de formularios, resúmenes o unidades funcionales.
- Agrupar indicadores comparables en una sola franja con separadores.
- Usar tarjetas para unidades independientes, secciones de formularios, modales, alertas o contenido que necesite destacarse del flujo principal.
- No acumular tarjetas dentro de otras tarjetas.
- Las tablas usan encabezados persistentes cuando el desplazamiento lo requiera.
- Las filas interactivas tienen un objetivo táctil mínimo de 44 px.
- Todo estado combina texto o ícono con color.
- Las acciones destructivas o de cambio de estado requieren confirmación.
- Los documentos se muestran con nombre lógico, tipo, fecha, responsable y acciones autorizadas.
- No ofrecer eliminación física; usar inactivación o versión según la regla funcional.

## Responsividad y accesibilidad

- Desde 1280 px se aplica la estructura completa.
- Entre 768 y 1279 px se reorganizan columnas y las tablas se desplazan dentro de su contenedor.
- El alcance entre 360 y 767 px continúa sujeto a la decisión institucional de soporte móvil.
- Toda interacción funciona con teclado.
- El foco es visible y no depende únicamente del color.
- Etiquetas, ayudas y errores se relacionan semánticamente con sus controles.
- Los modales devuelven el foco al elemento que los abrió.
- Las regiones dinámicas anuncian carga, resultados y errores cuando corresponda.

## Aplicación

Los tokens deben centralizarse como variables CSS o en el tema del sistema de componentes. Ningún módulo crea una paleta o escala tipográfica paralela. Toda excepción se documenta en `FRONTEND_DECISIONS.md`.
