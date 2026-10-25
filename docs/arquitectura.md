# Arquitectura técnica

## Decisiones

| Decisión | Motivo |
|---|---|
| NestJS | Módulos, controladores, servicios, validación y pruebas en TypeScript. |
| MVC modular | Separa rutas/controladores, reglas de negocio/servicios y vistas o DTOs. |
| PostgreSQL | Base relacional existente y adecuada para integridad, auditoría y relaciones clínicas. |
| TypeORM | ORM de acceso con soporte directo de NestJS y entidades por esquema. |
| SQL como fuente de verdad | El esquema clínico ya se migró fuera del ORM; evita cambios accidentales. |
| Handlebars | Punto de partida para vistas server-side. |

## Límites del dominio

`beneficiaria` identifica a la persona. `expediente` es único y permanente para ella. La ficha inicial, los formularios y los niños se consultan dentro del expediente. `formulario_area` es la cabecera de cada atención; sus detalles pertenecen a Psicología, Medicina, Social, Legal y Guardería.

## ORM y migraciones

TypeORM se usa para repositorios, transacciones y consultas, no para modificar automáticamente el esquema:

```ts
synchronize: false
migrationsRun: false
schema: 'new_horizons'
```

Cada migración SQL nueva necesita respaldo, prevalidación, prueba en copia y plan de reversión.

## Próximos módulos

1. Seguridad: autenticación, sesiones, roles y permisos.
2. Beneficiarias y expediente: consulta, alta controlada y búsqueda.
3. Formularios: cabecera, detalles y autorización por área.
4. Albergue: estancias y movimientos.
5. Documentos, auditoría y reportes.

## Puesta en marcha del equipo

Cada integrante debe clonar el repositorio, ubicarse en la rama indicada por su área, ejecutar `pnpm install`, copiar `.env.example` a `.env` y configurar una base PostgreSQL local. La compilación de referencia es `pnpm run build`.

El archivo `.env` es local y nunca se versiona. Las credenciales de desarrollo deben ser distintas de las de producción. TypeORM no crea tablas ni sincroniza columnas: el esquema `new_horizons` se prepara mediante migraciones SQL revisadas.

Si el workflow de GitHub Actions no puede iniciar por una incidencia de facturación, el equipo puede continuar con la verificación local. El bloqueo afecta al check automático, no a la rama ni a los commits.
