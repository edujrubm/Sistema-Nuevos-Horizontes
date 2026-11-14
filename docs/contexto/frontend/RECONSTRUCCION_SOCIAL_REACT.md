> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Reconstrucción del frontend de Trabajo Social

Fecha: 13 de noviembre de 2026. Trabajo local autorizado por Eduardo. Se siguieron las instrucciones del repositorio, las cinco secciones existentes, el contenido institucional de las imágenes y los componentes visuales compartidos. No se añadieron menús por integrante ni se modificaron migraciones.

## Resultado y rutas

El router general carga bajo demanda las páginas propias del dominio:

| Vista | Ruta React | Enlace del entorno local de esta revisión |
| --- | --- | --- |
| Listado y resumen | /beneficiarias/:beneficiariaId/social | http://127.0.0.1:5180/beneficiarias/100/social |
| Nueva ficha | /beneficiarias/:beneficiariaId/social/nueva | http://127.0.0.1:5180/beneficiarias/100/social/nueva |
| Consulta o continuación | /beneficiarias/:beneficiariaId/social/:fichaId | http://127.0.0.1:5180/beneficiarias/100/social/11 |

El enlace histórico /beneficiarias/:beneficiariaId/fichas/:fichaId consulta el tipo y redirige SOCIAL a la nueva página, sin modificar la resolución de Legal o Guardería. La ficha 11 es sintética, creada en esta revisión; su enlace depende de que siga activa esta base local.

## Arquitectura

- API tipada del dominio sobre el cliente HTTP y contratos existentes.
- Hook propio para carga, borrador, guardado, confirmación, conflictos y protección de cambios pendientes.
- Páginas propias de listado/editor, sin importar módulos organizados por integrantes ni repositorios o hooks privados de Legal.
- Configuración única de campos y cinco secciones, consumida también por los puentes temporales del editor anterior.
- Componentes neutrales reutilizados: cabecera de beneficiaria, pestañas, marco de secciones, errores y paginación. No se crearon estilos paralelos ni dependencias nuevas.

Se revisó la organización de Legal como referencia de capas; Social tiene sus propios casos y no incorpora la variante de referencia legal. Se conservaron Identificación, Historia de violencia, Diagnóstico y riesgos, Plan de intervención y Cierre. La tarjeta del plan usa el término institucional Plan de tratamiento.

## Comportamiento

El listado conserva resumen, estados, páginas y enlaces a consultar/continuar. El descarte es inline en la fila, exige motivo de 3 a 500 caracteres y utiliza la versión vigente. Un bloqueo local evita solicitudes duplicadas mientras guarda.

El editor monta solo la sección activa y mantiene valores de las demás en memoria. Guarda a través del adaptador SOCIAL del motor común. Conserva null en campos opcionales, booleanos reales y la fecha institucional de Guatemala, independiente de la zona del dispositivo. 0067 se normaliza a 67 porque la clave PostgreSQL es bigint.

Los errores muestran etiquetas en español, enlaces hacia el campo y mensajes asociados mediante aria-invalid/aria-describedby. El enlace abre su sección y enfoca el control. Los errores de versión o resultado incierto conservan el borrador y bloquean otro envío hasta revisar la versión vigente.

La confirmación se ofrece sobre un borrador ya guardado, en la última sección, con revisión explícita y sin cambios locales pendientes. Un registro confirmado queda en consulta. Las capacidades visibles reutilizan el contexto común; no sustituyen autorización en el backend.

La navegación de Social ya no muestra acciones de Admisión. El ajuste del layout está limitado a rutas /social; las rutas y navegación de otros módulos mantienen su comportamiento. Se retira para Social la barra repetida de áreas, igual que el tratamiento existente de Legal.

## Archivos de esta entrega

| Archivo | Cambio |
| --- | --- |
| frontend/src/modules/social/api/social-api.ts | API propia para listado, resumen y operaciones comunes; rechaza fichas de otro tipo |
| frontend/src/modules/social/hooks/useSocialEditor.ts | Estado y flujo de edición del área |
| frontend/src/modules/social/pages/SocialEditorPage.tsx | Formulario de cinco secciones, errores, guardado, confirmación y consulta |
| frontend/src/modules/social/pages/SocialListPage.tsx | Listado, resumen, paginación y descarte |
| frontend/src/modules/social/social-form.config.ts | Centraliza secciones y etiquetas institucionales |
| frontend/src/modules/social/index.ts | Exportaciones públicas |
| frontend/src/modules/social/social.test.tsx | Once pruebas de comportamiento |
| frontend/src/app/router/router.tsx | Rutas propias de Social, cargadas bajo demanda |
| frontend/src/app/layouts/AppLayout.tsx | Navegación institucional de Social, sin acciones de Admisión |
| frontend/src/app/AreaRecordsLayout.tsx | Evita repetir la barra de áreas dentro de Social |
| frontend/src/modules/formularios/EditorFicha.tsx | Únicamente puente de redirección del enlace histórico SOCIAL |
| frontend/src/modules/formularios/secciones.ts | Reutiliza la definición pública de Social, sin duplicar secciones |
| docs/contexto/backend/PLAN_RECONSTRUCCION_SOCIAL.md | Estado y siguientes tareas |
| docs/contexto/backend/CONTENIDO_INSTITUCIONAL_SOCIAL.md | Cobertura actualizada del frontend |
| docs/contexto/frontend/RECONSTRUCCION_SOCIAL_REACT.md | Este informe |

Los nombres históricos de los dos puentes se indican para localizar los archivos reales; no pertenecen al nuevo módulo. El núcleo anterior sigue existiendo por consumidores de otras áreas y no se eliminó globalmente.

## Verificación

pnpm run check final aprobado: 47 pruebas backend, 158 frontend, tipos y compilaciones API/web. Las once nuevas pruebas cubren navegación propia, cinco secciones y conservación de valores, nulabilidad, fecha/identificador, guardado y redirección, confirmación, errores por campo, conflicto, consulta sin capacidades, listado/resumen, descarte y rechazo de otro tipo.

Comprobación manual en Brave con API y PostgreSQL reales:

| Límite | Evidencia |
| --- | --- |
| Vista → formulario | Nueva ficha abierta desde listado propio |
| Formulario → API | Guardado mediante la ruta común de formularios con tipo SOCIAL |
| API → datos | La ficha sintética 11 quedó con profesional 67 y versión 2 |
| Datos → respuesta | GET posterior recuperó el texto sintético guardado |
| Respuesta → vista | Listado pasó de una a dos fichas; continuar recuperó los datos |
| Enlace anterior → ruta nueva | /fichas/11 redirigió a /social/11 conservando contenido |

Captura: test-results/social-react-brave.png. Logs de verificación: test-results/social-frontend-final.log, social-preview-api.log, social-preview-api-error.log, social-preview-web.log y social-preview-web-error.log. Son artefactos locales ignorados, no datos productivos. Durante recarga en caliente apareció una advertencia de React Router sobre un único blocker; no bloqueó el guardado ni la recuperación. No se modificó el hook compartido para resolver esa advertencia en otras áreas.

La vista utiliza puerto 5180 y API 3032, ambos en loopback, con el PostgreSQL sintético existente en 55485. No se aplicaron migraciones ni se reiniciaron los procesos anteriores del usuario. El supervisor local está en test-results/serve-social-preview.cjs; esta configuración no es de despliegue y depende del laboratorio PostgreSQL activo.

## Pendientes explícitos

- Captura y corrección de la hoja evolutiva propia de Social: siguen diferidas según la coordinación de BD. El enlace utiliza el flujo existente; no se acredita que esa captura haya sido reconstruida en esta entrega.
- Carga y asociación del PDF firmado a su ficha; firma física, sin captura digital.
- Autenticación y autorización productivas; el entorno visual tiene capacidades sintéticas de desarrollo.
- Campos obligatorios y flujos institucionales de corrección pendientes del equipo.
- La comprobación visual se hizo en la ventana actual de Brave; no acredita una matriz completa de dispositivos o navegadores.

No se hizo commit, push ni PR. No se da por completado el módulo entero ni listo para producción por estos resultados.
