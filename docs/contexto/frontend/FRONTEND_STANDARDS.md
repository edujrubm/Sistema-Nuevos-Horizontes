# Estándares del frontend

## Convenciones generales

- Utilizar TypeScript estricto si la propuesta técnica es aprobada.
- Nombrar componentes, tipos y funciones en inglés técnico; mantener textos visibles y términos institucionales en español.
- Evitar archivos que mezclen llamadas de API, reglas de presentación y componentes extensos.
- Exportar desde el `index.ts` público de cada módulo y evitar imports hacia sus carpetas internas.
- Favorecer composición de componentes y funciones puras.
- Mantener constantes de permisos, rutas y claves de consulta en ubicaciones tipadas.

## Componentes

Un componente debe tener una responsabilidad visual clara. Las páginas coordinan componentes y hooks; no contienen detalles del cliente HTTP. Los componentes compartidos no conocen requisitos de un módulo concreto.

Cada vista remota debe contemplar:

- carga inicial;
- actualización;
- resultado vacío;
- resultado correcto;
- error recuperable;
- acceso denegado;
- sesión vencida.

Los componentes deben consumir los tokens definidos en `FRONTEND_DESIGN_SYSTEM.md`. No se permiten colores hexadecimales, tamaños tipográficos o radios aislados dentro de componentes salvo una excepción documentada.

Las vistas de escritorio deben aprovechar el ancho disponible. Formularios, tablas y paneles no se limitarán a una columna central estrecha cuando puedan distribuirse con claridad. La escala base usa cuerpo y controles de 18 px, etiquetas de 16 px, navegación de 18 px y títulos de página de 42 px.

Las tarjetas pueden agrupar apartados reconocibles de un formulario, resúmenes o unidades independientes. No se usará una tarjeta por cada dato ni se anidarán tarjetas para construir la jerarquía visual.

## Rendimiento en equipos institucionales

El perfil mínimo de referencia incluye computadoras con **6 GB de RAM y AMD A8-7410 APU con AMD Radeon R5 Graphics**. Las decisiones de interfaz deben favorecer una experiencia estable en ese hardware.

- Cargar rutas y módulos bajo demanda.
- Evitar dependencias grandes para funciones que puedan resolverse con controles nativos o utilidades pequeñas.
- No renderizar simultáneamente todas las páginas de formularios extensos; montar la página activa o impedir que las páginas ocultas ejecuten trabajo costoso.
- Memorizar solo cuando una medición demuestre beneficio; evitar duplicar grandes respuestas en varios estados.
- Paginar resultados y aplicar espera breve en búsquedas; cancelar solicitudes obsoletas.
- Evitar animaciones continuas, sombras extensas, filtros y desenfoques que carguen CPU o GPU.
- Probar los flujos de ficha inicial, expediente, albergue y reportes con compilación de producción y conjuntos de datos representativos.

## API y tipos

- Centralizar configuración, autenticación y normalización de errores.
- No usar respuestas sin tipo.
- Separar los DTO de transporte de los modelos de presentación cuando difieran.
- No confiar en validaciones del cliente como garantía de integridad.
- Cancelar solicitudes obsoletas cuando cambien filtros o se abandone la vista.
- Evitar reintentos automáticos de mutaciones si pudieran duplicar operaciones.

## Fechas y horas

- Intercambiar fechas y horas con zona o formato acordado con el backend.
- Mostrar fechas en el formato institucional aprobado.
- Distinguir fecha de atención, fecha de captura y fecha de corte.
- No calcular duración o edad histórica usando implícitamente la fecha actual cuando el requisito define otra fecha de referencia.

## Formularios

- Definir esquema y valores iniciales explícitos.
- No usar cero o cadenas ficticias para representar datos desconocidos.
- Conservar la grafía original y utilizar valores normalizados solo para búsqueda o comparación.
- Mostrar dependencias condicionales sin borrar silenciosamente valores existentes.
- Solicitar confirmación cuando una acción cambie estado, anule, inactive, restaure o cierre una estancia.

## Archivos

- Restringir la selección a PDF como orientación inicial, sin asumir que el atributo del navegador valida el contenido.
- Mostrar nombre lógico, tamaño, tipo, progreso y error de carga.
- No utilizar nombres personales para construir claves de almacenamiento.
- Solicitar enlaces privados temporales únicamente al consultar o descargar.
- Diferenciar documento vigente, versiones anteriores, inactivo y carga pendiente.

## Pruebas

La prueba debe validar comportamiento visible y reglas de interacción, evitando reproducir detalles internos de implementación.

Niveles propuestos:

1. Pruebas unitarias para transformaciones, permisos de presentación y validaciones complejas.
2. Pruebas de componentes para formularios, tablas, estados y acciones autorizadas o denegadas.
3. Pruebas de integración para cada flujo con API simulada.
4. Pruebas de extremo a extremo para autenticación, alta de beneficiaria, ficha, documento, seguimiento y movimientos del albergue.

Cada prueba relacionada con la especificación debe incluir el código del requisito en su nombre o metadatos.

## Datos de prueba

- Utilizar únicamente identidades y expedientes ficticios.
- Mantener fixtures pequeños y legibles.
- Cubrir datos ausentes, desconocidos y no aplicables.
- Incluir usuarios con permisos parciales y acciones denegadas.
- No copiar relatos, documentos ni datos obtenidos de la Asociación.

## Calidad mínima por cambio

Cuando las herramientas estén configuradas, ejecutar:

```text
formato
lint
comprobación de tipos
pruebas afectadas
compilación de producción
```

Las órdenes exactas se definirán en el repositorio. No inventar resultados ni declarar una verificación que no se haya ejecutado.

## Criterios para revisión

- El cambio está vinculado con requisitos aprobados.
- Los permisos y ámbitos se reflejan en rutas, vistas y acciones.
- No se filtran datos sensibles.
- Los estados alternos están implementados.
- Los formularios conservan información ante errores recuperables.
- La interfaz es operable con teclado y en los tamaños aprobados.
- Las pruebas demuestran el comportamiento y los casos denegados.
- No se incorporaron decisiones pendientes como si fueran definitivas.
