# Arquitectura NestJS

## Estilo confirmado

El backend se implementará como un **monolito modular en NestJS con patrón MVC adaptado a una API REST**. Se despliega como una sola aplicación y una sola unidad operacional, organizada en módulos funcionales. Este diseño permite transacciones consistentes entre beneficiarias, ficha inicial, formularios, documentos, auditoría y Albergue.

MVC se aplica dentro de cada módulo:

- **Model:** entidades, modelos de dominio, reglas, interfaces de repositorio y persistencia PostgreSQL.
- **View:** representaciones de salida de la API: DTO de respuesta, presenters/serializadores y documentos generados. La interfaz visual sigue perteneciendo al frontend React.
- **Controller:** controladores NestJS que reciben HTTP, validan DTO, obtienen el usuario autenticado, invocan servicios y entregan la representación correspondiente.

Los servicios complementan MVC para evitar controladores extensos. Los controladores no contienen SQL, autorización compleja ni reglas institucionales.

```text
src/
  main.ts
  app.module.ts
  config/
  common/
    auth/
    errors/
    pagination/
    validation/
    observability/
  modules/
    beneficiaries/
      controllers/
      models/
      views/
      services/
      repositories/
      dto/
      beneficiaries.module.ts
    initial-intake/
    area-records/
      psychology/
      social-work/
      medicine/
      legal/
      daycare/
    identity-access/
    administration/
    catalogs/
    evolution/
    documents/
    shelter/
    reports/
    audit/
  infrastructure/
    database/
    storage/
    email/
    jobs/
```

Cada módulo sigue la misma estructura cuando corresponda. No se crean carpetas vacías ni capas sin responsabilidad real.

## Responsabilidades de MVC y servicios

### Model

Incluye entidades, objetos de valor, políticas, modelos de persistencia e interfaces de repositorio. Los adaptadores PostgreSQL implementan esas interfaces desde infraestructura. El Model aplica invariantes y no depende de la forma visual de React. Los modelos de dominio no se exponen directamente como respuestas HTTP.

### View

En una API REST, la View es la representación que sale del backend. Incluye DTO de respuesta, presenters, serialización, paginación, archivos y representaciones imprimibles. Decide qué campos autorizados se muestran, pero no concede permisos ni ejecuta consultas.

### Controller

Declara rutas, códigos HTTP, DTO de entrada y metadatos de autorización. Delega inmediatamente al servicio apropiado. Traduce errores conocidos al contrato HTTP y no devuelve errores internos de PostgreSQL.

### Service

Orquesta casos de uso, autorización contextual, transacciones, concurrencia, auditoría y repositorios. Aunque Service no es una letra de MVC, es obligatorio en este proyecto para mantener delgados los controladores.

La dependencia esperada es:

```text
Controller -> Service -> Model/Repository
                     -> Presenter/View
Repository adapter -> PostgreSQL
```

Un módulo no consulta directamente las tablas privadas de otro. La coordinación se realiza mediante servicios públicos del módulo o casos de uso orquestadores.

## Módulos y responsabilidades

| Módulo | Responsabilidad |
|---|---|
| Identity & Access | cuentas, sesiones, recuperación, segundo factor, capacidades efectivas y autorizaciones excepcionales |
| Administration | usuarios, asignaciones, roles controlados, categorías y configuración versionada |
| Catalogs | áreas, geografía, ocupación, parentesco y demás catálogos versionables |
| Beneficiaries | identidad institucional, residencia, estado, búsqueda de coincidencias e inactivación/restauración |
| Initial Intake | borrador, 19 apartados, riesgo, agresores, hijos, referencias, confirmación y corrección |
| Area Records | formularios propios de Psicología, Trabajo Social, Medicina, Legal y Guardería |
| Evolution | hojas por área, entradas, acciones, corrección versionada y vínculos con formularios |
| Documents | metadatos, carga, versiones, consulta, descarga, impresión y anulación |
| Shelter | estancias individuales, presencia, movimientos y alta excepcional de nacimiento |
| Reports | consultas agregadas y exportaciones autorizadas |
| Audit | historial de cambios, accesos y consultas administrativas |

## Ejemplo de recorrido

Para `POST /api/v1/beneficiaries/:id/evolution`:

1. `EvolutionController` recibe y valida `CreateEvolutionEntryDto`.
2. Un guard autentica; el servicio verifica capacidad, área y caso.
3. `CreateEvolutionEntryService` abre una transacción y establece actor/motivo para los disparadores v2.
4. El Model valida acción, contenido, formulario y sujeto.
5. `EvolutionRepository` persiste en `entrada_evolutiva`.
6. `EvolutionEntryPresenter` construye la View JSON autorizada.
7. El controlador devuelve `201 Created`.

## Límites importantes

- `reports` lee proyecciones autorizadas; no modifica datos operativos.
- `audit` recibe eventos; no se usa como tabla operativa ni se edita desde la API.
- `documents` decide acceso con el área propietaria y la capacidad; una URL de archivo nunca equivale a autorización permanente.
- `shelter` no crea una segunda identidad para una persona ya registrada.
- `area-records` referencia el expediente y, cuando corresponde, un hijo; no copia el perfil como fuente editable.
- React no forma parte de la View de MVC del backend. Se comunica exclusivamente mediante el contrato HTTP.

## Procesos síncronos y asíncronos

Las confirmaciones, movimientos de Albergue, anulación, inactivación y auditoría mínima son síncronos y transaccionales. Correo, antivirus, exportaciones grandes y generación pesada de documentos pueden ejecutarse mediante trabajos idempotentes. El usuario recibe un identificador de trabajo y consulta su estado.

## Configuración

Validar variables al iniciar. Separar configuración por ambiente y usar un gestor de secretos. Como mínimo: conexión PostgreSQL, claves/sesiones, almacenamiento, correo, límites de archivos, CORS, zona horaria y observabilidad. Ningún secreto se incluye en Git ni se devuelve en endpoints de diagnóstico.

