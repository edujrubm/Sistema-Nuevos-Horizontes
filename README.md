# Sistema Nuevos Horizontes

Sistema institucional para la atención de beneficiarias, expedientes, niñas y
niños, formularios por área, albergue y documentos.

El repositorio contiene la API NestJS en `src/` y el cliente React/Vite en
`frontend/`. La guía vigente está en [docs/README.md](docs/README.md): allí se
concentran la arquitectura, decisiones abiertas y reglas de actualización.

## Inicio local

```sh
git clone https://github.com/edujrubm/Sistema-Nuevos-Horizontes.git
cd Sistema-Nuevos-Horizontes
git switch main
pnpm install --frozen-lockfile
cp .env.example .env
pnpm start:dev
```

En otra terminal, iniciar el cliente:

```sh
pnpm dev:web
```

Completar `.env` con las credenciales de la base local o de Neon autorizada. No
subir credenciales, datos personales, respaldos ni archivos privados.

## Verificación

```sh
pnpm run check
pnpm run test:core
```

Antes de una migración o despliegue, revisar
[la guía de migraciones](database/migrations/README.md) y el estado real de la
base destino. Una migración presente en Git no demuestra que ya esté aplicada.

## Colaboración

`main` debe contener integración revisada. Actualizar la rama de trabajo desde
su remoto antes de abrir un pull request y resolver conflictos sin editar una
migración aplicada. El proceso detallado está en
[docs/flujo-de-ramas.md](docs/flujo-de-ramas.md) y
[CONTRIBUTING.md](CONTRIBUTING.md).
