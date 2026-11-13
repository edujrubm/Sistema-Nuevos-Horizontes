# Legal

Ficha Legal y referencias de la beneficiaria, organizadas por módulo. No incorpora procesos legales de hijas o hijos.

## Organización

- LegalController → LegalService → LegalRepository: consultas y referencias.
- LegalFormRepository: persistencia TypeORM de la variante LEGAL, reutilizada por el motor común.
- dto/, entities/ y validation/: contratos, mapeos y validación del dominio.
- frontend/src/modules/legal/: páginas, configuración, API y hook del editor.

Los controladores reciben HTTP; LegalService conserva las validaciones de referencias y LegalRepository ejecuta sus escrituras. LegalFormRepository implementa la persistencia de fichas para el motor compartido. El contrato FormularioAreaRow vive en shared/contracts/. Los listados propios de Legal usan páginas y total; el motor compartido usa cursor. La auditoría de referencias resuelve el usuario mediante AUDIT_ACTOR_USERNAME dentro de la transacción.

El motor compartido depende del contrato FormularioAdapter y de FormularioAdapterRegistry, sin importar LegalModule, LegalFormRepository ni la validación jurídica. FormularioExtensionesModule provee una instancia del registro a ambos módulos. LegalModule registra su adaptador de fichas y su política de confirmación de referencias durante onModuleInit. El módulo publica LegalService; los repositorios permanecen internos.

La definición de una variante indica si requiere validación de confirmación. Si esa política no está registrada, el motor responde CONFIGURACION_INCOMPLETA y revierte la operación. Las otras variantes mantienen su implementación existente. Esto separa la dependencia de código; no acredita que el frontend, la autorización y toda la reconstrucción estén terminados.

Las operaciones de Legal usan entidades y repositorios TypeORM, transacciones y bloqueo de cabecera. El SQL restante establece el contexto de auditoría de PostgreSQL. La edad histórica conserva su expresión PostgreSQL dentro de QueryBuilder. El recorrido de ficha Legal no usa SQL CRUD directo ni local_json_seguro.

## API

Prefijo /api/v1. Se conservan las seis rutas del módulo:

| Método | Ruta |
| --- | --- |
| GET | /legal/beneficiarias/:id/fichas |
| GET | /legal/beneficiarias/:id/referencias |
| POST | /legal/beneficiarias/:id/referencias |
| GET | /legal/referencias/:id |
| PATCH | /legal/referencias/:id |
| POST | /legal/referencias/:id/confirmar |

La ficha reutiliza estas rutas compartidas:

| Método | Ruta |
| --- | --- |
| GET / POST | /beneficiarias/:id/formularios-area, con tipo LEGAL |
| GET / PATCH | /formularios-area/:id |
| POST | /formularios-area/:id/confirmar |
| POST | /formularios-area/:id/descartar |
| GET | /tipos-formulario |

El motor delega únicamente la variante LEGAL al adaptador ORM; las demás conservan sus operaciones. Las referencias confirmadas admiten correcciones con motivo, versión e historial. La ficha Legal confirmada permanece en consulta en el flujo ordinario. No se agregan obligatoriedades o transiciones pendientes de D-04.

## Frontend

| Vista | Ruta |
| --- | --- |
| Listado de fichas | /beneficiarias/:id/legal |
| Nueva ficha | /beneficiarias/:id/legal/nueva |
| Consultar o continuar | /beneficiarias/:id/legal/:fichaId |
| Listado de referencias | /beneficiarias/:id/referencias |
| Nueva referencia | /beneficiarias/:id/referencias/nueva |
| Consultar o corregir referencia | /beneficiarias/:id/referencias/:fichaId |

Se mantienen las cuatro secciones del diseño: partes y fecha, diagnóstico y plan, proceso judicial y diligenciamiento. Actora proviene del perfil existente. La interfaz conserva los borradores ante fallos, exige confirmación explícita y bloquea escrituras tras un conflicto de versión. El descarte solicita motivo desde el listado, sin borrar datos.

La navegación utiliza el layout institucional y el menú de Legal, sin un menú por integrante. Los enlaces de Documentos y Hoja evolutiva conservan los módulos compartidos. La URL histórica de una ficha Legal redirige al editor del módulo.

## Integración y configuración

1. Usar Node.js 24 y pnpm 11.25.0 según CONTRIBUTING.md.
2. Verificar el esquema aprobado y las migraciones de database/migrations/ en el destino. Su presencia en Git no demuestra que estén aplicadas.
3. Este ajuste de pruebas y verificación no modifica migraciones ni utiliza sincronización automática. El destino debe tener la ampliación de formularios, los campos adicionales, las restricciones y los triggers requeridos. Las migraciones aplicadas conservan su identidad histórica.
4. Configurar FORM_DRAFT_STATE_CODE, FORM_CONFIRMED_STATE_CODE y FORM_DISCARDED_STATE_CODE con códigos presentes en la base.
5. En desarrollo y pruebas, configurar explícitamente AUDIT_ACTOR_USERNAME con un usuario existente. Tanto fichas como referencias usan los códigos FORM_* configurados. El helper de referencias impide utilizar la identidad técnica en producción; no sustituye una sesión autenticada.
6. VITE_DEV_CAPABILITIES=true habilita capacidades sintéticas sólo en desarrollo. El build productivo conserva consulta hasta disponer de la sesión real.
7. Con la conexión autorizada en el entorno o .env, ejecutar:

```sh
pnpm run build:api
node scripts/check-legal-schema.cjs
```

El chequeo es de solo lectura: verifica columnas mapeadas, estados, variantes, usuario técnico y triggers activos de auditoría. La transacción de verificación es de solo lectura y no consulta contenido de expedientes. No aplica migraciones ni acredita autenticación. D-02 y D-03 conservan sus pendientes de sesión y almacenamiento definitivo. Integrar esta rama no habilita por sí mismo escrituras productivas.

## Verificación reproducible

```sh
pnpm run check
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-legal.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-areas.ps1
```

Ambos ejecutores requieren PostgreSQL local y usan PostgreSQL 18 por defecto. Cada uno crea un clúster desechable en loopback, aplica fixtures sintéticas y migraciones y detiene únicamente su servidor. No eliminan directorios ni tocan Neon o la base compartida. Los parámetros PostgresBin, Port y NodeExe permiten ajustar las herramientas.

Legal carga test/fixtures/legal.sql y usa BORRADOR, CONFIRMADO y DESCARTADO. La aplicación de integración registra LegalModule, FormularioSharedModule, DatabaseModule y ErroresApiModule; no arranca AppModule. Una prueba comprueba que solo están registrados LegalController y FormularioSharedController. Otra arranca el motor sin Legal y verifica que una referencia no se confirma sin su política, conservando versión e historial. El esquema de ensayo sigue siendo el esquema completo: el aislamiento corresponde a los módulos de aplicación y a los datos específicos del área.

El ejecutor test-areas.ps1 conserva por separado la preparación de regresión entre áreas. Ambos ejecutores comprueban que existen todos los archivos de pruebas antes de invocar Node y restauran las variables de entorno al terminar.

Postman incluye las seis rutas de Legal y el flujo de ficha común:

```sh
pnpm exec newman run postman/Legal.postman_collection.json
```

La colección usa http://127.0.0.1:3000/api/v1, beneficiaria sintética 100 y profesional 1. Ejecutarla únicamente con la API conectada a una base de ensayo preparada. baseUrl permite seleccionar otro puerto local; la colección rechaza destinos fuera de loopback.

Las pruebas cubren consultas, creación, guardado, confirmación, descarte lógico,
correcciones de referencias, conflictos, auditoría y reversión. La regresión
ampliada comprueba errores, otras áreas, documentos y Albergue. Se verificó en Brave, con API real y PostgreSQL local desechable, la creación de ficha, guardado en sus cuatro secciones, confirmación y consulta, creación y corrección de referencia con motivo, conservación de datos ante profesional inexistente y descarte lógico desde el listado. Los datos persistidos, las versiones y el historial se contrastaron en la base de ensayo. Esta comprobación de desarrollo no acredita autenticación ni aceptación del despliegue productivo.

La autenticación productiva y la verificación del ambiente destino permanecen como responsabilidades compartidas. Las pruebas delimitan el alcance revisado y no acreditan esas piezas.


## Revisión del flujo React con API real

- La creación de una ficha conserva la fecha de atención de Guatemala y navega al identificador devuelto por la API.
- La ficha confirmada queda en consulta; la referencia admite iniciar una corrección con motivo.
- Durante una corrección editable no se muestra el aviso de modo de consulta.
- Una respuesta incierta bloquea nuevas escrituras en el editor para evitar repetir una operación que pudo haberse guardado. Los valores locales se conservan. Para una creación sin identificador recibido se debe consultar el listado antes de iniciar otra; para un registro existente se puede cargar su versión vigente.
- No se modificaron estilos, distribución de secciones ni campos del diseño existente.
- La suite web pasó 143 pruebas y el build productivo compiló. Incluye tres regresiones nuevas sobre escrituras inciertas y el aviso de consulta durante correcciones.

Pendientes: sesión y autorización reales, integración definitiva de documentos y evolución en sus módulos propietarios y aceptación en el entorno de despliegue. La navegación global todavía contiene consumidores heredados de otras áreas; esta revisión no los declara reconstruidos.


## Errores de campo en Legal

Las validaciones devuelven el contrato común en español, con errores formados por campo y mensaje, sin incluir los valores enviados. Un profesional inexistente se identifica con profesionalId y un error del detalle con su ruta detalle.campo. La validación del detalle reúne sus campos inválidos en una respuesta.

El editor presenta los nombres visibles del formulario en un resumen. Sus enlaces abren la sección correspondiente y enfocan el control. El campo se marca con aria-invalid, un borde de error y un mensaje asociado mediante aria-describedby. Los mensajes repetidos del mismo campo se agrupan en un único enlace. No se borran los valores al recibir el error.

El fixture de Legal incluye el profesional sintético 67. Si se introduce 0067 en el editor, se envía la cadena canónica 67: la clave bigint de PostgreSQL no almacena ceros iniciales. Esto no crea una cuenta ni cambia el capturista auditado.
