> Entrega local de integración del 4 de noviembre: consultar [informe vigente](docs/integracion/INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md), [preguntas al equipo](docs/integracion/DUDAS_EQUIPO_FRONTEND.md) y [frontend React](frontend/README.md). Las menciones posteriores al prototipo HTML corresponden al trabajo histórico; el laboratorio runtime se retiró de esta entrega.

# Sistema Nuevos Horizontes

Sistema institucional para atención de beneficiarias, expedientes permanentes, niñas y niños, formularios por área, albergue y documentos.

El backend NestJS y el frontend React viven en este mismo repositorio, con
código, configuración y procesos de desarrollo separados.

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

Para distinguir el estado actual del código de la documentación histórica,
consultar [Estado técnico comprobado](docs/ESTADO_TECNICO_ACTUAL.md). En
particular, Persona 1 ya agregó migraciones SQL versionadas; la verificación de
una instancia concreta de PostgreSQL sigue siendo una actividad independiente.

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

En otra terminal iniciar el frontend:

```sh
pnpm dev:web
```

Consultar `CONTRIBUTING.md` para el flujo completo de ramas, Pull Requests,
verificación y despliegue.

Completar `.env` con las credenciales locales de PostgreSQL. Nunca subir ese archivo al repositorio.

- El servidor queda preparado para registrar rutas después de definir los contratos funcionales.

### Verificación

```sh
pnpm check
```

Este repositorio no utiliza GitHub Actions. Antes de crear un Pull Request o
integrar cambios, cada integrante debe ejecutar localmente:

El comando local comprueba tipos del frontend, pruebas de backend y frontend, y
la compilación completa. El resultado debe adjuntarse al Pull Request.

El responsable del Pull Request debe adjuntar la salida de esos comandos o
indicar que fueron ejecutados correctamente. La revisión de código y la ausencia
de conflictos continúan siendo obligatorias.

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

## Avance local Persona 3 - ciclo 2

Implementación de 14 rutas de Social, Legal/referencias, Guardería y evolución transversal. Consulte [avance y ejecución](docs/persona3/AVANCE.md), [preguntas al grupo](docs/persona3/PREGUNTAS_AL_GRUPO.md), [OpenAPI provisional](docs/persona3/openapi.json) y [Postman](postman/Persona3.postman_collection.json). Las rutas se sirven bajo /api/v1 solo en laboratorio local, sin autenticación en este ciclo. No se han aprobado los estados ni las reglas institucionales de confirmación.

Comandos: pnpm test:persona3 y pnpm start:persona3.

## Correcciones de mockups y BD

Ver [contexto de correcciones](docs/persona3/CONTEXTO_CORRECCIONES_MOCKUPS_BD.md) para alcance, migraciones, validación y límites del laboratorio opcional.
