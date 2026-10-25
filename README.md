# Sistema Nuevos Horizontes

Sistema institucional para atención de beneficiarias, expedientes permanentes, niñas y niños, formularios por área, albergue y documentos.

## Arquitectura inicial

El backend usa NestJS con MVC modular y PostgreSQL:

```text
src/
├── common/                 # Guardias, filtros, decoradores y utilidades
├── database/               # Configuración TypeORM y entidades PostgreSQL
├── modules/                # Módulos de dominio por área
│   ├── beneficiarias/
│   ├── expedientes/
│   ├── ninos/
│   ├── formularios/
│   ├── albergue/
│   ├── seguridad/
│   ├── health/
│   └── home/
├── views/                  # Plantillas Handlebars
└── main.ts
```

PostgreSQL y sus scripts SQL versionados son la fuente de verdad. TypeORM se usa para acceso a datos; `synchronize` y `migrationsRun` están desactivados para impedir cambios automáticos al esquema clínico.

## Inicio local

### Requisitos

- Node.js 24 LTS o compatible con el proyecto.
- pnpm 11.
- PostgreSQL con el esquema `new_horizons` instalado.
- Git.

### Instalación y configuración

```sh
git clone https://github.com/edujrubm/Sistema-Nuevos-Horizontes.git
cd Sistema-Nuevos-Horizontes
git switch main
pnpm install
copy .env.example .env
pnpm start:dev
```

Completar `.env` con las credenciales locales de PostgreSQL. Nunca subir ese archivo al repositorio.

- El servidor queda preparado para registrar rutas después de definir los contratos funcionales.

### Verificación local

```sh
pnpm run build
```

Si GitHub Actions está temporalmente bloqueado por facturación, esta compilación local es la verificación mínima para continuar trabajando. El bloqueo de Actions no elimina ni invalida los commits del Pull Request.

### Política temporal de verificación

El repositorio utiliza GitHub de forma gratuita y actualmente no se dispone de ejecución funcional de GitHub Actions por una restricción de facturación de la cuenta. Hasta que esa restricción cambie, la verificación oficial será local:

```sh
pnpm install --frozen-lockfile
pnpm run build
```

El responsable del Pull Request debe adjuntar la salida de esos comandos o indicar que fueron ejecutados correctamente. La revisión de código y la ausencia de conflictos continúan siendo obligatorias.

### Problemas comunes

- `pnpm` no reconocido: instalar Node.js y habilitar pnpm con Corepack o instalar pnpm 11.
- Error de conexión: revisar `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER` y `DATABASE_PASSWORD`.
- Error de esquema: comprobar que PostgreSQL tenga `new_horizons` y que se hayan aplicado los scripts SQL aprobados.
- No usar `synchronize: true`: TypeORM no debe modificar automáticamente la base clínica.

## Organización del trabajo

- `main` contiene los cambios integrados y revisados.
- Las ramas por área son `medicina`, `psicologia`, `legal`, `social`, `albergue`, `guarderia` y `administracion`.
- Cada equipo trabaja en la rama de su área y propone su integración en `main` mediante un Pull Request.
- Integrar los cambios mediante Pull Requests y revisión del equipo.
- Evitar subir contraseñas, credenciales, datos personales o entrevistas.

## Primeros pasos

```sh
git clone https://github.com/edujrubm/Sistema-Nuevos-Horizontes.git
cd Sistema-Nuevos-Horizontes
git fetch origin
git switch main
```

Para trabajar en un área, por ejemplo medicina:

```sh
git fetch origin
git switch medicina
git pull --ff-only origin medicina
```

Reemplazar `medicina` por la rama correspondiente. Antes de integrar cambios, revisar y resolver los posibles conflictos con `main`.

Cada integrante debe configurar su propio nombre y correo en Git antes de realizar commits.

## Flujo recomendado

- `main`: solo integración revisada y funcional.
- `infraestructura/nestjs-bootstrap`: base técnica inicial y decisiones transversales.
- Ramas por área: implementan módulos sobre la base integrada, sin modificar directamente el modelo clínico compartido.
- Cambios a base de datos: una migración SQL nueva; nunca editar ni volver a ejecutar una ya aplicada.
- Todo cambio se integra mediante Pull Request.

## Base de datos y seguridad

- `.env`, contraseñas, tokens, respaldos y datos personales no se suben a Git.
- Las migraciones aplicadas se conservan intactas; un cambio posterior se expresa en otro archivo secuencial.
- Las pruebas con datos ficticios se ejecutan únicamente en una base de desarrollo o copia desechable.
- Antes de una migración real se requiere respaldo, prevalidación y ventana de mantenimiento.
