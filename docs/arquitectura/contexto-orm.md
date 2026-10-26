# Contexto técnico: ORM para Sistema Nuevos Horizontes

## Objetivo

Este documento define el ORM recomendado y las reglas para conectarlo al sistema `nuevos_horizontes`. Su propósito es orientar la configuración futura de NestJS sin modificar todavía rutas, entidades funcionales ni reglas clínicas.

## Recomendación

El ORM recomendado para el proyecto es **TypeORM** sobre **PostgreSQL**.

```text
NestJS
└── TypeORM
    └── PostgreSQL / esquema new_horizons
```

## ¿Por qué TypeORM?

TypeORM es la opción más adecuada para esta base por las siguientes razones:

- Tiene integración oficial y directa con NestJS mediante `@nestjs/typeorm`.
- Trabaja naturalmente con PostgreSQL, claves foráneas, índices, transacciones y vistas.
- Permite representar tablas existentes sin obligar a reconstruir el esquema.
- Permite usar repositorios y servicios separados por módulo.
- Facilita trabajar con relaciones complejas como expediente, formularios, niños y detalles por área.
- Permite consultar tablas y vistas con entidades distintas.
- El equipo puede utilizar TypeScript, decoradores y validación coherente con NestJS.

## ¿Por qué no usar Prisma como ORM principal?

Prisma también sería técnicamente viable y ofrece una experiencia muy buena para proyectos nuevos. Sin embargo, para este caso TypeORM es más conveniente porque:

- La base ya existe y contiene un esquema institucional diseñado previamente.
- Hay SQL heredado, claves compuestas, restricciones, triggers, auditoría y vistas.
- Se necesita respetar el DDL existente como fuente de verdad.
- No se quiere que una herramienta regenere o reinterprete automáticamente el modelo clínico.
- TypeORM permite una transición más gradual: primero se configura la conexión, después se agregan entidades por módulo.

Prisma podría evaluarse en el futuro, pero cambiar de ORM ahora agregaría una decisión técnica innecesaria y no aporta una ventaja suficiente para la fase actual.

## Regla principal: el SQL es la fuente de verdad

TypeORM se utilizará para acceso a datos, repositorios y transacciones. No será el dueño automático del esquema.

La configuración debe mantener:

```ts
synchronize: false
migrationsRun: false
schema: 'new_horizons'
```

Nunca se debe activar:

```ts
synchronize: true
```

`synchronize: true` podría intentar agregar, modificar o eliminar columnas en una base clínica y no debe utilizarse en desarrollo compartido, pruebas con datos reales ni producción.

## Configuración base esperada

Paquetes principales:

```text
@nestjs/typeorm
typeorm
pg
@nestjs/config
class-validator
class-transformer
```

Variables mínimas:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=new_horizons
DATABASE_USER=postgres
DATABASE_PASSWORD=change-me
DATABASE_SSL=false
```

La contraseña y cualquier dato de conexión real deben permanecer únicamente en `.env` o en el sistema seguro de configuración. Nunca deben subirse al repositorio.

## Esquema institucional

Todas las entidades deben indicar explícitamente el esquema:

```ts
@Entity({ schema: 'new_horizons', name: 'expediente' })
export class Expediente {}
```

No se debe depender de que el `search_path` del servidor esté configurado correctamente en cada ambiente.

## Modelo conceptual que debe respetarse

```text
beneficiaria
└── expediente permanente
    ├── ficha_inicial
    ├── formulario_area
    │   ├── Psicología
    │   ├── Medicina
    │   ├── Trabajo Social
    │   ├── Legal
    │   ├── Guardería
    │   ├── seguimientos
    │   └── documentos
    └── nino
```

El expediente es permanente y único por beneficiaria. No debe crearse un expediente nuevo cada vez que la persona recibe una atención posterior.

## Organización de entidades

Las entidades futuras deben separarse por responsabilidad:

```text
src/database/entities/
├── beneficiaria.entity.ts
├── expediente.entity.ts
├── nino.entity.ts
├── formulario-area.entity.ts
├── usuario.entity.ts
└── empleado.entity.ts
```

Las entidades clínicas específicas pertenecen al módulo correspondiente y no deben colocarse todas en un único archivo:

```text
src/modules/formularios/
├── shared/
├── psicologia/
├── medicina/
├── social/
├── legal/
└── guarderia/
```

## Reglas para entidades PostgreSQL

### Identificadores `bigint`

PostgreSQL puede manejar identificadores `bigint` mayores que el límite seguro de JavaScript. Por eso los IDs deben representarse como `string` en TypeScript, no como `number`.

```ts
@PrimaryGeneratedColumn({ name: 'id_expediente', type: 'bigint' })
id!: string;
```

No se debe convertir un ID de PostgreSQL a `number` sin una razón explícita.

### Fechas

- `date` representa una fecha civil sin hora.
- `timestamptz` representa un instante real con zona horaria.
- No convertir automáticamente una fecha clínica civil en timestamp.
- Las fechas de atención y captura deben conservar significados diferentes.

### Valores desconocidos

No reemplazar datos desconocidos por valores inventados.

```text
TRUE  = sí
FALSE = no
NULL  = desconocido, no preguntado o no aplica según la regla del formulario
```

### Texto clínico

Motivos, historias, observaciones, planes terapéuticos, diagnósticos narrativos y antecedentes deben permanecer como texto mientras el área no apruebe catálogos estructurados.

No crear tablas únicamente porque dos campos narrativos tienen nombres parecidos.

### JSONB

Los campos JSONB existentes deben conservarse como objetos o estructuras documentadas. El ORM no debe convertirlos automáticamente en texto ni imponer una estructura clínica que no haya sido aprobada.

## Relaciones y navegación

Las relaciones se deben definir con cuidado y solo cuando el esquema ya las confirme. En especial:

- `beneficiaria` identifica a la persona.
- `expediente` identifica el contenedor permanente.
- `formulario_area` identifica una atención o formulario.
- Los detalles de Psicología, Medicina, Social, Legal y Guardería dependen de `formulario_area`.
- `nino` pertenece al expediente y puede ser el sujeto de formularios infantiles.
- Las vistas se consultan como lectura; no se deben usar para insertar datos.

No duplicar `beneficiaria_id` en todas las tablas si el esquema final aprobado obtiene la identidad mediante `expediente`. Si una columna duplicada se conserva por integridad, debe existir una restricción que impida contradicciones.

## Migraciones

Las migraciones deben ser SQL versionado:

```text
database/migrations/
├── 001_inicial.sql
├── 002_expediente_y_formularios.sql
└── 003_descripcion_del_cambio.sql
```

Reglas:

1. No editar una migración que ya fue aplicada.
2. Crear una migración nueva para cada cambio posterior.
3. Probar la migración en una copia antes de producción.
4. Hacer respaldo antes de cambios destructivos.
5. Documentar las columnas migradas y los datos afectados.
6. No ejecutar scripts de prueba con datos ficticios en producción.

TypeORM no debe generar migraciones automáticamente para este proyecto sin revisión humana.

## Repositorios y servicios

Los controladores no deben consultar TypeORM directamente.

```text
controller
    ↓
service / caso de uso
    ↓
repository / TypeORM
    ↓
PostgreSQL
```

El servicio debe concentrar:

- Validaciones de negocio.
- Transacciones.
- Autorización por área.
- Creación y actualización de formularios.
- Manejo de versiones y motivos de cambio.

## Transacciones clínicas

La creación de un formulario debe ejecutarse en una transacción cuando involucre:

1. Cabecera `formulario_area`.
2. Detalle clínico.
3. Documentos.
4. Auditoría.
5. Versionado.

No se debe dejar una cabecera sin su detalle obligatorio ni un detalle sin cabecera.

## Vistas

Las vistas PostgreSQL, por ejemplo `v_hoja_evolutiva` o `v_identidad_formulario`, sirven para consultas consolidadas.

No son tablas de almacenamiento y no deben recibir operaciones de inserción o actualización desde la aplicación.

## Fase actual del proyecto

Actualmente el repositorio contiene la infraestructura y la estructura de carpetas, pero todavía no se han definido rutas, entidades funcionales, DTOs ni servicios clínicos.

El orden aprobado es:

```text
estructura
→ contratos y rutas
→ entidades aprobadas
→ servicios
→ controladores
→ pruebas
→ integración por área
```

## Verificación local

Mientras no se utilice la ejecución automática de GitHub Actions, la verificación local mínima es:

```bash
pnpm install --frozen-lockfile
pnpm run build
```

Estos comandos verifican la instalación y compilación del proyecto, pero no sustituyen las pruebas de integración contra una base PostgreSQL de prueba.

## Decisión final

Para este proyecto se utilizará TypeORM como ORM de acceso, PostgreSQL como motor y SQL versionado como fuente de verdad del esquema. La prioridad es preservar la integridad de la base existente y evitar que el ORM introduzca cambios automáticos en la estructura clínica.
