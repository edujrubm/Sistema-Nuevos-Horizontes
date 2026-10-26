# Arquitectura del frontend

## Objetivo

Construir una aplicación web en React centrada en formularios organizados por pestañas para registrar y consultar beneficiarias, fichas, expedientes, seguimientos y movimientos del albergue, respetando el ámbito de cada usuario y la confidencialidad de los datos.

La arquitectura debe facilitar el desarrollo por módulos dentro de una sola aplicación desplegable, permitir pruebas independientes y evitar que los componentes visuales dependan directamente de detalles del backend.

Este diseño se fundamenta en tres fuentes: el anteproyecto define la aplicación web React y sus módulos; la Hoja de Requerimientos V3 define el comportamiento y las reglas; el diagrama de base de datos identifica las entidades preliminares. La correspondencia concreta está en `FRONTEND_DATA_MODEL.md`.

La navegación por módulos lleva al usuario al flujo apropiado; dentro de la ficha inicial, las pestañas dividen el formulario institucional en secciones manejables. La propuesta de pestañas y su mapeo a campos están en `FRONTEND_FORMS.md`.

La presentación visual se rige por `FRONTEND_DESIGN_SYSTEM.md`, que centraliza paleta, tipografía, espaciado, estructura de navegación y accesibilidad.

El frontend debe funcionar con fluidez en equipos institucionales de recursos limitados, incluidos equipos con **6 GB de RAM y procesador AMD A8-7410 APU con AMD Radeon R5 Graphics**. Esta referencia forma parte del entorno mínimo de diseño y prueba, no de los datos del dominio.

## Decisiones base propuestas

Las siguientes herramientas constituyen una propuesta técnica inicial y deben confirmarse al crear el repositorio:

| Necesidad | Propuesta | Estado |
|---|---|---|
| Lenguaje | TypeScript con modo estricto | Propuesto |
| Interfaz | React | Propuesto en el anteproyecto |
| Construcción | Vite | Pendiente de aprobación técnica |
| Rutas | React Router | Pendiente de aprobación técnica |
| Estado remoto | TanStack Query | Pendiente de aprobación técnica |
| Formularios | React Hook Form | Pendiente de aprobación técnica |
| Esquemas del cliente | Zod | Pendiente de aprobación técnica |
| Pruebas unitarias | Vitest y Testing Library | Pendiente de aprobación técnica |
| Pruebas de flujos críticos | Playwright | Pendiente de aprobación técnica |

La plantilla React mencionada en el anteproyecto debe evaluarse antes de adoptarla. Sus componentes, licencia y convenciones visuales no deben determinar la arquitectura del dominio.

## Estilo arquitectónico

Se utilizará una arquitectura modular orientada a funcionalidades. Cada módulo agrupa páginas, componentes, consultas, formularios, tipos y pruebas de su dominio. Los recursos compartidos permanecen fuera de los módulos y no incorporan reglas específicas de una funcionalidad.

```text
src/
├── app/
│   ├── App.tsx
│   ├── providers/
│   ├── router/
│   ├── layouts/
│   └── config/
├── modules/
│   ├── auth/
│   ├── administration/
│   ├── beneficiaries/
│   ├── admission/
│   ├── area-records/
│   │   ├── psychology/
│   │   ├── social-work/
│   │   ├── medical/
│   │   ├── legal/
│   │   └── nursery/
│   ├── documents/
│   ├── follow-up/
│   ├── shelter/
│   ├── reports/
│   └── audit/
├── shared/
│   ├── api/
│   ├── auth/
│   ├── components/
│   ├── forms/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── validation/
├── assets/
├── styles/
└── test/
```

## Responsabilidad de las capas

### `app`

Configura proveedores globales, rutas, límites de error, tema, sesión y cliente de consultas. No contiene reglas propias de beneficiarias, expedientes o albergue.

### `modules`

Contiene las funcionalidades del producto. Un módulo puede exponer páginas y una API pública pequeña para que otros módulos reutilicen operaciones autorizadas. No debe importar archivos internos de otro módulo.

Los módulos responden a los flujos institucionales, no a una carpeta por tabla. Por ejemplo, la ficha de admisión reúne `beneficiaria`, `residencia`, `ficha_inicial`, `agresor`, `nino` y catálogos; el albergue utiliza `activos_albergue` y `movimiento_albergue`, además de datos de las personas alojadas.

### `shared`

Contiene elementos reutilizables sin conocimiento de un dominio concreto: cliente HTTP, controles de formulario, tablas, mensajes, utilidades de fecha y primitivas de autorización.

## Estructura interna de un módulo

```text
modules/beneficiaries/
├── api/
├── components/
├── forms/
├── hooks/
├── pages/
├── schemas/
├── types/
├── utils/
├── tests/
└── index.ts
```

No es obligatorio crear todas las carpetas. Solo deben existir cuando el módulo tenga contenido que las justifique.

## Módulos funcionales

### Autenticación y sesión

Incluye inicio y cierre de sesión, activación, restablecimiento de contraseña mediante correo institucional, expiración por inactividad y presentación del segundo factor que finalmente se apruebe en `PV3`. Todas las cuentas pueden cerrar sesión y solicitar el restablecimiento cuando dispongan de correo institucional. Administración general gestiona la habilitación o configuración del segundo factor; el mecanismo concreto continúa sujeto a `PV3`. Los tokens no se exponen a componentes de dominio.

### Administración

Incluye cuentas, asignaciones de roles y ámbitos, administración de categorías de ficha inicial, configuración del segundo factor e historial de accesos. Estas acciones corresponden a Administración general. El informe consolidado de acciones y avance es una propuesta de diseño pendiente de confirmación; no se debe crear todavía una ruta ni capacidad de producción para Administración general.

### Beneficiarias

Incluye búsqueda previa, coincidencias permitidas, alta con o sin documento, perfil general, estado activo o inactivo e historial autorizado. El identificador interno se trata como inmutable.

El diagrama ya representa `beneficiaria` y relaciones con residencia, etnia, ocupación, escolaridad y ubicación geográfica. El perfil del frontend debe integrar esos datos en una vista autorizada. El historial de RF-BE7 incorpora fichas, seguimientos, documentos y estancias cuando existan contratos para ellos; no equivale a un campo de la tabla `beneficiaria`.

### Ficha de admisión

Incluye borrador, campos condicionales, catálogos versionados, validación, confirmación y representación imprimible autorizada. La identidad actual y la instantánea histórica de la entrevista deben mostrarse sin confundirlas.

La captura se presenta como un único formulario de admisión con varias pestañas. Cambiar de pestaña conserva los valores ingresados, muestra el estado de cada sección y no confirma la ficha hasta que se cumplan las reglas aprobadas. Un borrador incompleto sigue siendo borrador y no se cuenta como atención confirmada.

El formulario parte de `ficha_inicial` y las tablas relacionadas del diagrama, incluidos agresores, niños, tipos de violencia, objetos o medios de agresión, situaciones de riesgo, referencias y apoyo recibido. Los 19 apartados institucionales y el bloque de riesgo determinan los grupos visibles; `FRONTEND_FORMS.md` conserva el inventario detallado. Los campos o estados ausentes del diagrama se registran como brechas.

### Expediente y documentos

Incluye listado por área y tipo, carga PDF, versiones, estados de procesamiento, consulta y acciones independientes de impresión, descarga y anulación. La descarga se divide en documentos generales y documentos específicos del área. La anulación corresponde a la coordinación del área propietaria, conserva el archivo y registra motivo, responsable y fecha. Los enlaces privados deben solicitarse al utilizarlos y no conservarse como estado duradero.

Cada documento digital pertenece a un área. Solo el personal autorizado de esa área puede consultarlo; la Directora accede al conjunto desde la generación o consulta del expediente completo. Compartir con otra área se realiza fuera de la consulta digital mediante descarga o impresión autorizada por el área propietaria.

### Formularios de área

`area-records` agrupa Psicología, Trabajo Social, Medicina, Legal y Guardería. Cada submódulo conserva sus esquemas y pantallas, pero reutiliza cabecera de persona, pestañas, borrador, historial y controles de capacidad.

Se organiza por flujo institucional, no por tabla ni rol. Un Digitalizador de área y un profesional pueden usar el mismo formulario con acciones distintas. Los datos generales se consultan del perfil autorizado y no crean una identidad paralela.

### Hojas evolutivas

Incluye anotaciones ordenadas por fecha de atención, fecha de captura, correcciones, anulaciones y restituciones según permisos. Nunca se sobrescribe visualmente el pasado sin ofrecer historial.

`hoja_evolutiva` aporta beneficiaria, área, correlativo y `accion`. Cada alta de una entrada debe solicitar la acción realizada y mostrarla en el historial junto con el contenido. El cliente completa automáticamente la fecha visible usando `America/Guatemala`; el servidor asigna y devuelve la fecha y hora autoritativas al confirmar. La presentación requerida por RF-HE necesita además autoría, fechas, tipo, contenido e historial de cambios que el diagrama no muestra completos.

### Albergue

Incluye estancias, ingresos, salidas temporales, retornos, egresos y conteo de personas alojadas. Las operaciones se presentan como acciones distintas. En esta etapa no administra habitaciones, camas ni espacios individuales.

`activos_albergue`, `estado_albergue` y `movimiento_albergue` reflejan una base preliminar. El sistema distingue ingreso, salida temporal, retorno y egreso definitivo, y crea una estancia individual para cada persona alojada. Antes del ingreso, verifica que el CUI no tenga otra estancia `ACTIVO`. El panel y los reportes separan beneficiarias de hijas, hijos o infantes.

### Reportes

Incluye filtros autorizados, unidad de conteo, resultados, estados vacíos y exportaciones permitidas. Administración general exporta reportes institucionales y las coordinaciones exportan únicamente reportes de su ámbito. Debe diferenciar personas, casos, atenciones y seguimientos.

El mockup pendiente del informe consolidado explora identidad autorizada, antecedentes, diagnóstico, planes, avances, alcances, seguimiento y resultados. Si se aprueba, las acciones se presentarían como conteos agrupados por `hoja_evolutiva.accion`, área y período. La decisión institucional, los permisos y el contrato de API siguen pendientes.

### Auditoría

Incluye la consulta del historial de accesos para Administración general y el historial de modificaciones para Dirección, Administración general y las coordinaciones dentro de su ámbito. No reconstruye auditoría a partir de eventos almacenados por el navegador.

## Flujo de datos

```text
Página o formulario
        ↓
Hook del módulo
        ↓
Servicio de API tipado
        ↓
Cliente HTTP compartido
        ↓
API del backend
```

La respuesta recorre el camino inverso y se transforma en un modelo de presentación cuando sea necesario. Los componentes visuales no deben ejecutar solicitudes HTTP directamente.

## Estado

- Estado remoto: consultas y mutaciones obtenidas del servidor.
- Estado de formulario: valores, errores y campos condicionales del formulario activo.
- Estado de interfaz: filtros, paneles, pestañas y selección temporal.
- Estado de sesión: identidad básica y capacidades entregadas por el servidor.

No se debe duplicar información remota en un almacén global. Los datos sensibles no deben persistirse en `localStorage` ni `sessionStorage`. Cualquier excepción técnica deberá documentarse y aprobarse.

## Autorización en la interfaz

La sesión debe proporcionar capacidades, ámbito y restricciones vigentes. Las rutas y acciones usan esas capacidades para decidir qué presentar. Un componente puede ocultar o deshabilitar una acción, pero el servidor debe validar nuevamente la solicitud.

Ejemplos de capacidades:

```text
beneficiaria.registrar
general.consultar
evolucion.agregar
documento.cargar
documento.consultar
documento.imprimir
documento.descargar
documento.descargar_general
documento.descargar_area
documento.anular
estancia.gestionar
movimiento.registrar
reporte.generar
reporte.exportar
auditoria.modificaciones.consultar
auditoria.accesos.consultar
autenticacion.segundo_factor.administrar
ficha_inicial.categorias.administrar
```

No se implementarán comprobaciones rígidas como `rol === "administrador"` cuando la decisión real dependa de capacidades y ámbito.

## Formularios

Los formularios deben:

- validar en el cliente para orientar al usuario y aceptar los errores devueltos por el servidor;
- mostrar el error junto al campo y explicar cómo corregirlo;
- conservar valores ante errores recuperables;
- distinguir borrador y confirmación cuando el requisito lo establezca;
- advertir antes de abandonar cambios sin guardar;
- evitar dobles envíos mientras una confirmación está en curso;
- manejar conflictos sin sobrescribir silenciosamente cambios ajenos;
- representar valores desconocidos y no aplicables de forma explícita.

## Comunicación con la API

El frontend consumirá una API HTTPS. Hasta definir el contrato del backend, cada módulo utilizará una interfaz tipada y adaptadores que puedan conectarse a dobles de prueba.

Los tipos del cliente describirán recursos y operaciones autorizadas, no filas de PostgreSQL. Para cada endpoint futuro se documentará el mapeo `requisito → vista → recurso de API → entidades del diagrama → brechas`. Los identificadores y relaciones inferidos por nombre en el PDF deberán confirmarse al revisar el esquema SQL real.

Los errores se normalizarán al menos en estas categorías:

- validación;
- autenticación requerida;
- acceso denegado;
- recurso inexistente;
- conflicto de estado o edición;
- fallo temporal del servicio;
- fallo inesperado con identificador de incidente.

Los mensajes no deben revelar trazas ni información interna.

## Navegación propuesta

La navegación se construirá a partir de capacidades y podrá incluir:

- Inicio;
- Beneficiarias;
- Fichas y expedientes;
- Seguimiento;
- Albergue;
- Reportes;
- Administración;
- Auditoría.

La existencia de una opción de menú no concede acceso. Las rutas protegidas deben comprobar la sesión y las capacidades antes de mostrar su contenido.

## Diseño responsivo y accesibilidad

La prioridad propuesta es escritorio desde 1366 píxeles. Entre 768 y 1365 píxeles los formularios deben reorganizarse y las tablas pueden desplazarse dentro de su contenedor. La consulta móvil entre 360 y 767 píxeles permanece sujeta a `PV7`.

Todos los flujos deben ser utilizables con teclado, conservar foco visible, relacionar etiquetas y campos, anunciar errores y no depender únicamente del color. Los cuadros de confirmación deben devolver el foco a la acción que los abrió.

## Privacidad en la interfaz

- Mostrar únicamente datos necesarios para la tarea.
- Ocultar bloques médicos, psicológicos, de riesgo y relatos si no existe capacidad específica.
- Evitar nombres, DPI/CUI y datos sensibles en títulos de páginas, parámetros de URL y nombres de archivos internos.
- Limpiar vistas sensibles al cerrar sesión o perder autorización.
- No incluir contenido sensible en herramientas de analítica o seguimiento de errores.
- Aplicar máscaras visuales solo como ayuda; nunca tratarlas como mecanismo de seguridad.

## Límites de error

La aplicación tendrá un límite de error global y límites por módulo cuando permitan recuperar una parte de la interfaz. Un fallo debe presentar una acción segura para reintentar y un identificador de incidente cuando el servidor lo proporcione.

## Estrategia de evolución

La implementación debe avanzar por módulos y requisitos aprobados. Cada fase debe incluir rutas, contratos simulados, estados, permisos, pruebas y criterios de aceptación. La integración real reemplazará adaptadores sin reescribir los componentes de presentación.

## Presupuesto de rendimiento del cliente

- Dividir rutas y módulos para cargar inicialmente solo la funcionalidad necesaria.
- Evitar librerías visuales duplicadas, fondos animados, desenfoques costosos y efectos continuos de GPU.
- Mantener el estado de formularios extenso de forma localizada; no provocar el renderizado completo de la ficha por cada pulsación.
- Renderizar únicamente la página activa de una ficha y conservar sus valores en el estado del formulario.
- Paginar o virtualizar listados extensos y limitar resultados enviados por la API.
- Comprimir imágenes e iconos, preferir SVG pequeños y cargar recursos secundarios bajo demanda.
- Medir compilación de producción, tamaño de recursos, tiempo de interacción y consumo de memoria en un equipo equivalente al perfil mínimo antes de aceptar los flujos críticos.
