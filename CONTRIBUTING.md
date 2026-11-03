# Guía de colaboración

Este repositorio contiene el backend NestJS, el frontend React y los scripts de
base de datos. Cada parte conserva límites propios y se integra desde `main`.

## Requisitos locales

- Node.js 24.
- pnpm 11.25.0, habilitado con `corepack enable`.
- Acceso autorizado a una base PostgreSQL de desarrollo.
- Git.

## Preparar una copia local

```sh
git clone https://github.com/edujrubm/Sistema-Nuevos-Horizontes.git
cd Sistema-Nuevos-Horizontes
git switch main
pnpm install --frozen-lockfile
```

Crear `.env` a partir de `.env.example` y completar únicamente credenciales del
entorno de desarrollo. `.env` nunca se confirma en Git ni se comparte por un
Pull Request.

## Ejecutar el sistema

En desarrollo se usan dos procesos para conservar recarga rápida:

```sh
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:web
```

- React: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`

Vite redirige `/api` al backend local. El navegador no se conecta directamente
a PostgreSQL.

## Ramas y Pull Requests

1. Actualizar `main`: `git switch main` y `git pull --ff-only origin main`.
2. Crear una rama corta desde `main`:
   - `feat/frontend-ficha-inicial`
   - `fix/conflicto-version-ficha`
   - `docs/flujo-despliegue`
3. Hacer cambios pequeños relacionados con una sola necesidad.
4. Ejecutar `pnpm check` antes de subir la rama.
5. Abrir un Pull Request hacia `main`, adjuntar el resultado de `pnpm check` y
   solicitar revisión.
6. No fusionar si la verificación local falla o existen conflictos pendientes.

Las ramas históricas por área se revisan antes de integrarlas. Persona 3 se
integra únicamente desde `schema-persona3`; no se fusionan por separado
`evolucion`, `social`, `legal` y `guarderia`.

## Distribución del código

```text
frontend/                  React y TypeScript
  src/app/                 proveedores, rutas y layout
  src/modules/             flujos funcionales
  src/shared/              API, controles y utilidades reutilizables
src/                       NestJS y TypeScript
  modules/                 módulos del dominio
  common/                  errores, validación y utilidades transversales
database/                  migraciones SQL versionadas
docs/                      decisiones y contexto técnico
```

No importar internals de otro módulo. Cada módulo expone una superficie pública
pequeña. Los componentes React no hacen `fetch` directamente: llaman al servicio
tipado del módulo, que utiliza el cliente HTTP compartido.

## Base de datos

- PostgreSQL y las migraciones aprobadas son la fuente de verdad.
- `synchronize` y `migrationsRun` permanecen desactivados.
- Una migración aplicada es inmutable; cualquier ajuste crea otra migración.
- Nunca ejecutar SQL experimental o pruebas sobre la base compartida.
- No incluir datos reales en fixtures, capturas o pruebas.

## Condición mínima de un Pull Request

```sh
pnpm check
```

Este comando comprueba tipos del frontend, pruebas de backend y frontend, y la
compilación completa. El Pull Request debe explicar alcance, pruebas realizadas,
variables nuevas y cualquier cambio de base de datos.

El repositorio no utiliza GitHub Actions. La verificación se ejecuta localmente
para evitar costos y fallos externos; la revisión humana del Pull Request sigue
siendo obligatoria.

## Despliegue

La configuración de Render permanece pendiente de acuerdo del equipo. El
frontend no modifica el arranque ni las rutas del backend. Antes de desplegar se
debe decidir si serán dos servicios o un único servicio y acordar CORS, URL de
API, variables secretas y verificación de salud con el responsable del backend.
