# Rutas de Persona 3 integradas en main

Comprobación del 12 de noviembre de 2026 sobre `main`, commit base `3fc3b6cebc11d8b698b7e3f79ea098f25c8efd6e`.

## Resultado

Las rutas de Legal, Trabajo Social y Guardería **ya estaban implementadas y registradas en main**. No faltaba importar estos módulos ni agregar controladores. La documentación de cada área todavía decía que no existían rutas; también el índice de módulos describía únicamente el esqueleto inicial. Se corrigieron esas afirmaciones y se publica este inventario para que los diagramas no usen ese estado histórico como estado actual.

Esta corrección es documental. No cambia rutas, lógica, esquema ni permisos. No incorpora las correcciones locales de la auditoría de Persona 4, que siguen pendientes de ejecución aislada.

## Cadena de registro de NestJS

```text
AppModule
└── DomainModule
    ├── FormulariosModule
    │   ├── LegalModule → LegalController
    │   ├── SocialModule → SocialController
    │   └── GuarderiaModule → GuarderiaController
    └── EvolucionModule → EvolucionController
```

Los cuatro módulos importan `Persona3CoreModule`, que expone `Persona3Service` y `Persona3Repository`. La implementación común no implica que los controladores de área estén vacíos.

`src/main.ts` establece `app.setGlobalPrefix("api")`; los controladores usan `@Controller("v1")`. Por tanto, las URL reales empiezan con `/api/v1`, aunque el decorador de cada método solo contenga la parte restante.

## Inventario de las 14 rutas específicas

| Área | Método | Ruta completa |
|---|---|---|
| Legal | GET | `/api/v1/legal/beneficiarias/:id/fichas` |
| Legal | GET | `/api/v1/legal/beneficiarias/:id/referencias` |
| Legal | POST | `/api/v1/legal/beneficiarias/:id/referencias` |
| Legal | GET | `/api/v1/legal/referencias/:id` |
| Legal | PATCH | `/api/v1/legal/referencias/:id` |
| Legal | POST | `/api/v1/legal/referencias/:id/confirmar` |
| Trabajo Social | GET | `/api/v1/trabajo-social/beneficiarias/:id/resumen` |
| Trabajo Social | GET | `/api/v1/trabajo-social/beneficiarias/:id/fichas` |
| Guardería | GET | `/api/v1/guarderia/beneficiarias/:id/hijos` |
| Guardería | GET | `/api/v1/guarderia/hijos/:id/fichas` |
| Evolución | GET | `/api/v1/beneficiarias/:id/hoja-evolutiva` |
| Evolución | POST | `/api/v1/beneficiarias/:id/hoja-evolutiva` |
| Evolución | PATCH | `/api/v1/entradas-evolutivas/:id` |
| Evolución | GET | `/api/v1/entradas-evolutivas/:id/revisiones` |

## Operaciones compartidas

Las fichas de área se crean, consultan, editan, confirman y descartan mediante `FormularioSharedController`, registrado también en `FormulariosModule`. No es necesario duplicar esas operaciones bajo `/legal`, `/trabajo-social` o `/guarderia`. Véase `src/modules/formularios/README.md` para las siete rutas compartidas.

Los PDF usan el módulo único `src/modules/documentos`; no se agregan controladores de carga duplicados por área. Las vistas React están en `frontend/src/modules/persona3` y se conectan desde `frontend/src/app/router/router.tsx`.

## Verificación efectuada y límites

- Actualización de referencias desde origin y comprobación del código de main.
- Recorrido estático de imports, declaración de módulos, controladores, proveedores y prefijos; los tres controladores de área y Evolución tienen rutas registradas.
- Inventario de 14 decoradores HTTP específicos, sin duplicados, contrastado con el contrato OpenAPI versionado cuando se dispone de esas operaciones.
- Revisión de diff y comprobación de que esta entrega solo modifica documentación.

No se ejecutó servidor, compilación, PostgreSQL ni navegador para esta corrección documental. Esto verifica presencia y registro por fuente; no certifica que una instancia desplegada esté actualizada ni que su base tenga todas las migraciones. Si una instalación devuelve 404, comprobar commit desplegado, prefijo `/api/v1` y reinicio del servidor antes de concluir que faltan las rutas en GitHub.

## Integración histórica verificable

- `bf34689`: PR #6 desde `evolucion`.
- `25f43b2`: integración de Persona 3 con el frontend común.
- `6c37077`: integración Social, PR #7.
- `3ab5331`: integración Legal, PR #8.
- `eafc99b`: integración Guardería, PR #9.
- `54a7d8a`: PR #26 de integración del equipo.

Un diagrama debe tomar los decoradores y el grafo de módulos actuales, además de la documentación. Los nombres de las ramas no representan por sí solos las rutas publicadas.
