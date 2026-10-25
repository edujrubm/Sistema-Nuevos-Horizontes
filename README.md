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

```sh
cp .env.example .env
pnpm install
pnpm start:dev
```

- Página MVC: `http://localhost:3000/`
- Estado del servicio: `http://localhost:3000/api/health`

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
