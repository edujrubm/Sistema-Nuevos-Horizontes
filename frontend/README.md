# Frontend React

Cliente web de Nuevos Horizontes. Vive en el mismo repositorio, pero mantiene su
código y configuración separados de la API NestJS.

## Comandos

Desde la raíz del repositorio:

```sh
pnpm dev:web
pnpm typecheck:web
pnpm test:web
pnpm build:web
```

Durante desarrollo, Vite sirve el cliente en `http://localhost:5173` y redirige
las solicitudes `/api` a NestJS en `http://localhost:3000`.

## Organización

- `src/app`: configuración global, rutas, layouts y proveedores.
- `src/modules`: funcionalidades institucionales.
- `src/shared`: cliente HTTP, componentes y utilidades sin reglas de dominio.
- `src/styles`: tokens y estilos globales.

Las páginas coordinan componentes y hooks. Las llamadas HTTP viven en `api/`
dentro del módulo. Los contratos del cliente describen recursos de la API, no
filas directas de PostgreSQL.

## Reglas importantes

- Textos visibles en español; nombres técnicos en inglés.
- No guardar información sensible en `localStorage`, `sessionStorage`, URL o logs.
- La interfaz usa capacidades; no autoriza por nombre de rol.
- Mantener estados de carga, vacío, error, acceso denegado y conflicto.
- Los borradores conservan datos ante errores recuperables.
- No inventar catálogos, obligatoriedad o reglas institucionales.
