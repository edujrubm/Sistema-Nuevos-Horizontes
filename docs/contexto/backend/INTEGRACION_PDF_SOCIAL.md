> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Integración del PDF firmado de Trabajo Social

Fecha: 13 de noviembre de 2026. Continuación local de la reconstrucción autorizada por Eduardo. Se reutilizó el módulo de Documentos existente: no se creó otra carga de archivos, categoría obligatoria, almacenamiento o ruta backend de Social.

## Qué cambió

La ficha Social confirmada muestra Adjuntar PDF firmado. El enlace abre Documentos con tipo=SOCIAL y formularioId, por ejemplo:

http://127.0.0.1:5181/beneficiarias/100/documentos?tipo=SOCIAL&formularioId=1

El parámetro es una ayuda de navegación, no autorización. Documentos debe encontrar esa ficha de tipo SOCIAL y estado confirmado dentro del contexto entregado por el servidor. Si no aparece, deshabilita la nueva carga dirigida y explica el motivo. Al abrir una carga nueva desde este enlace, precarga y bloquea la ficha correspondiente. Una versión documental existente conserva su propio formulario conforme al flujo anterior.

En el backend común de carga se añadió una comprobación de estado exclusivamente para SOCIAL: se rechaza con ESTADO_NO_PERMITIDO si la ficha no está confirmada. Se realiza tras bloquear y comprobar ficha, expediente y área, dentro de la transacción existente. No añade consultas SQL: reutiliza la cabecera ya recuperada. Las operaciones de archivo, validación PDF, hash, versionado, auditoría, limpieza ante error y almacenamiento siguen siendo responsabilidad de Documentos.

La firma se realiza en papel. El sistema adjunta el PDF proporcionado, sin capturar una firma digital ni asegurar que su contenido incluya una firma válida. Solo se admiten PDFs conforme al contrato común; no se incorporaron cámara ni conversión de imágenes.

## Asociación persistida

El vínculo se guarda en documento_area.formulario_id. PostgreSQL y el servicio común comprueban la relación con la ficha, expediente y área. No se duplicó información documental en ficha_social.

No se asigna automáticamente formulario_area.firma_documento_id ni se marca el documento VIGENTE. El módulo conserva su estado de revisión inicial BORRADOR: elegir un adjunto principal como firma y aprobar su revisión son operaciones diferentes, que no se inventaron en esta entrega. Puede haber documentos y versiones vinculados a la misma ficha; no se impuso unicidad nueva.

La pantalla continúa siendo Documentos del área: el listado muestra sus documentos autorizados, no un filtro nuevo por ficha. La selección dirigida aplica a la nueva carga. Las acciones sobre versiones de documentos ya existentes conservan el comportamiento del módulo propietario.

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| frontend/src/modules/social/pages/SocialEditorPage.tsx | Enlace desde la ficha confirmada al flujo documental existente |
| frontend/src/modules/social/social.test.tsx | Comprueba el enlace y sus parámetros después de confirmar |
| frontend/src/modules/documentos/DocumentsPage.tsx | Contexto opcional de ficha Social, validación contra datos del servidor, precarga y bloqueo del selector |
| frontend/src/modules/documentos/DocumentsPage.test.tsx | Tres pruebas de carga dirigida, contexto no autorizado y borrador |
| src/modules/documentos/carga-pdf.service.ts | Comprobación de estado confirmado para SOCIAL, sin alterar las reglas de otras áreas |
| test/areas.integration.cjs | Prueba real de rechazo previo, carga posterior y aislamiento de expediente |
| docs/contexto/backend/PLAN_RECONSTRUCCION_SOCIAL.md | Actualiza el avance |
| docs/contexto/backend/CONTENIDO_INSTITUCIONAL_SOCIAL.md | Actualiza la cobertura del PDF |
| docs/contexto/backend/INTEGRACION_PDF_SOCIAL.md | Este informe |

El ajuste común es compatible por defecto: las pantallas que no reciben una ficha Social siguen con su selector normal. El backend nuevo solo comprueba el caso SOCIAL. No se reescribió la persistencia interna heredada de Documentos; Social continúa usando su adaptador ORM propio para formularios. No se afirma que todo Documentos haya sido reconstruido con ORM.

## Pruebas ejecutadas

- pnpm run check aprobado: tipos, 47 pruebas backend, 161 frontend y compilaciones API/web.
- Suite de áreas en PostgreSQL desechable: 57 pruebas aprobadas, cero fallos; conserva las 56 pruebas existentes y añade la de PDF Social.
- La prueba nueva crea un borrador Social y verifica el rechazo 409; comprueba que no se creó documento, confirma la ficha, carga un PDF real sintético y recupera la asociación por formularioId. El mismo formulario con otra beneficiaria se rechaza con 404.
- Los casos existentes siguen comprobando formatos inválidos, PDF protegido, tamaño, almacenamiento, permisos de área, versiones, auditoría e integración de otros módulos.
- Los tres casos frontend nuevos comprueban que el multipart mantiene el formulario autorizado y que no se permite iniciar una carga dirigida para una ficha ajena al contexto o en borrador.

Evidencias locales ignoradas: test-results/social-pdf-check.log y test-results/social-pdf-integracion.log.

## Comprobación en Brave y límite observado

Se abrió una ficha Social sintética confirmada y se siguió su enlace a Documentos. La pantalla mostró el ámbito Trabajo Social y la ficha SOCIAL #1 precargada y bloqueada. Se comprobó la fecha y el tipo del documento en el formulario.

La selección automática del archivo fue bloqueada por la extensión de Brave, que requiere acceso a URLs de archivo para ese mecanismo. No se cambiaron permisos del navegador. Por ello no se acredita una carga completa desde Brave en esta entrega: la carga completa sí fue verificada mediante HTTP real y PostgreSQL, y la interfaz de selección/carga mediante sus pruebas frontend.

Captura de la selección vinculada, no de una carga finalizada: test-results/social-pdf-vinculo-brave.png. El entorno de esta comprobación usa web 5181 y API 3033, en loopback, separado de las ventanas anteriores. Su supervisor es test-results/serve-social-pdf-preview.cjs. Solo configura el contexto técnico de ensayo que el módulo común ya utiliza; no implementa sesión o permisos productivos.

## Pendientes

Captura/corrección de la hoja evolutiva de Social sigue diferida por coordinación del esquema. Continúan pendientes autenticación productiva, decisiones institucionales de formularios, operación de almacenamiento y aprobación documental. La próxima tarea independiente es preparar la colección Postman del dominio y la revisión final de contratos y pendientes.

Sin commit, push ni PR. Sin cambios de esquema o migraciones ni escrituras contra la base compartida del grupo. Las cargas de integración se hicieron en clústeres sintéticos propios.
