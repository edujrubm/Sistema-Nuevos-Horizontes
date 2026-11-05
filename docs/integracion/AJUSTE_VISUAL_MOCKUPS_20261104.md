> Corrección de navegación posterior: se eliminó el menú que agrupaba el trabajo de Persona 3 y la pantalla “Continuar la atención”. Persona 3 es únicamente el reparto interno de responsabilidades. La entrada es Beneficiarias → expediente; dentro de cada área se usa su menú contextual del ZIP. El frontend pasa ahora 23 pruebas, incluido el enlace directo al historial dentro de la hoja evolutiva.

# Ajuste visual a los mockups de Persona 3

Fecha: 4 de noviembre de 2026. La interfaz anterior consultaba los mockups, pero simplificaba su distribución. Esta corrección toma los HTML del ZIP del usuario como referencia visual vigente.

## Cambios implementados

| Referencia | Ajuste en React |
|---|---|
| Marco institucional | Cabecera morada de 82 px, logo NH circular, contexto del área, navegación lateral, aviso de privacidad y breadcrumb |
| Beneficiaria seleccionada | Tarjeta con nombre real recibido de la API, iniciales, expediente y DPI/CUI protegido; nunca se copian nombres ficticios del mockup |
| Legal | Cuatro páginas: Partes y fecha, Diagnóstico y plan, Proceso judicial, Diligenciamiento. Datos del registro separados de Partes |
| Trabajo Social | Cinco páginas: Identificación, Historia de violencia, Diagnóstico y riesgos, Plan de intervención, Cierre |
| Guardería | Cinco páginas: Ingreso, Traslado, Situación familiar, Madre y padre, Escolaridad y salud |
| Progreso | Barra de pasos, página actual, panel lateral y Anterior/Siguiente. Navegar conserva el contenido y no simula guardado |
| Referencia legal | Hoja de referencia, identidad consultada del expediente y vista previa del contenido actual |
| Hoja evolutiva | Captura y cronología con panel de reglas lateral en escritorio |
| Controles y estilos | Colores, bordes, tarjetas, campos cortos/largos, selectores y checklist de riesgos basados en los mockups |
| Responsive | Menú desplegable, secciones accesibles y navegación de páginas; no se pierde el acceso al ocultar la barra lateral |

## Reglas funcionales que se conservan

- No se cambió el backend ni la BD. El ajuste solo afecta frontend y documentación/referencias.
- Guardado, confirmación, errores, versión, motivo e historial siguen consumiendo las API reales.
- Legal sigue siendo de la beneficiaria; no se agregan procesos legales para hijos.
- Guardería conserva apertura de fichas solo para inscritos.
- Una referencia confirmada permanece en consulta hasta iniciar una corrección autorizada.
- El checklist Social usa el campo de texto riesgosIdentificados existente, con una opción por línea; conserva también el texto libre y sus repeticiones. No activa el catálogo SQL experimental ni calcula un total clínico.
- La fecha de atención y el profesional siguen siendo explícitos: no se sustituye la atención por la fecha automática de captura del prototipo.
- Acción evolutiva sigue siendo texto libre, como acordó el usuario; no se impone la lista provisional del HTML.

## Diferencias pendientes de datos/contrato

- Traslado/autorizaciones y datos paternos completos no llegan en la consulta operativa de Guardería. Se presentan como información no disponible, sin inventar autorizaciones ni nombres.
- El nombre del profesional y algunos catálogos aún requieren su contrato; no se sustituyen IDs por nombres ficticios del mockup.
- Documentos y Reportes aparecen en el marco visual, pero sus accesos no simulan una operación inexistente. La pantalla documental sigue correspondiendo a Persona 4.
- La impresión de referencias requiere la capacidad correspondiente; no se añadió un permiso de impresión por defecto.
- El cierre Social institucional no se activa por escoger una página o registrar una fecha.
- El porcentaje del panel indica la posición de navegación; no certifica obligatoriedad, guardado ni aprobación de secciones.

## Verificación

`pnpm --dir frontend check`: TypeScript correcto, 18 pruebas aprobadas y build productivo correcto. Incluye cinco regresiones nuevas: cuatro páginas de Legal, persistencia del borrador entre las cinco páginas de Social, cinco secciones de Guardería sin autorizaciones inventadas, vista previa de referencia y preservación del texto al usar el checklist de riesgos.

Revisión de navegador: ficha Legal real del entorno sintético, navegación entre páginas, contexto/selección del área y menú expandido en pantalla estrecha. Comprobación móvil: ancho útil 375 px y scrollWidth 375 px.

Evidencia local (fuera del repositorio): output/ajuste_mockups_20261104/legal-escritorio.png y legal-movil.png. Backend y SQL sin diferencias respecto al commit anterior. Los cambios se conservan localmente; no se publican en GitHub.

## Trazabilidad del ZIP

Se compararon los bytes de las cinco referencias conservadas con sus originales dentro del ZIP; coincidencia exacta.

| Archivo del ZIP | SHA-256 |
|---|---|
| mockup_modulo_legal.html | 7e46c48f4eb28e81c17f476cabd84be2eb3e9d780d0fddc1628565e867bc312c |
| mockup_modulo_trabajo_social.html | 86c1b6f527171af6d1e583e5ebb19600dd28c8126ede9deb3d8398a8c8d365dc |
| mockup_modulo_guarderia.html | ef60eddb5c979f79e08ae947aca616c83e3cf1cd033d1d89ee19336b82250974 |
| mockup_referencia_legal.html | dc71870065cd89d403dd4cb5291c4b9fa761e6135251ee8362ae60749b113987 |
| mockup_shared.css | 441b6e11255f2f75289c2990980d954a0c99e292ddfa22ac331c72361773209c |

## Navegación institucional corregida

- Se retiraron el inicio de captura manual de ID y las tarjetas de áreas creadas como landing del trabajo P3.
- Se usa la consulta de Beneficiarias del mockup, con datos reales de la API y acceso al expediente. Es un adaptador de lectura de las API de Persona 1, no otra implementación de su CRUD.
- El expediente muestra el resumen y las secciones institucionales, incluidas las áreas de otros compañeros, sin inventar pantallas operativas para ellas.
- El menú de Legal muestra Beneficiarias, Área Legal, Hoja evolutiva, Documentos y Reportes; Social y Guardería usan su propio contexto. No se ofrece un menú de las responsabilidades del desarrollador.
- Las secciones aún no integradas permanecen deshabilitadas. El código del shell debe incorporarse al shell común del equipo, sin crear un segundo portal.
- Referencias sigue accesible desde Legal mediante “Hoja de referencia”, sin convertirla en un módulo del menú principal.
- Fuentes adicionales: mockup_beneficiarias_expediente.html y mockup_expediente_direccion.html del ZIP. El resumen no concede permisos de Dirección ni consulta datos clínicos de otras áreas.
- Verificación: 23 pruebas frontend, TypeScript y build correctos; recorrido real Beneficiarias → expediente → Legal y comprobación del menú contextual. Backend y SQL sin cambios.
