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

## Contexto profesional durante desarrollo

La creación de formularios clínicos exige el identificador del profesional
responsable. Mientras autenticación no publique ese contexto, puede definirse
`VITE_DEV_PROFESSIONAL_ID` únicamente en el entorno local de Vite. El valor se
considera público, no debe ser un secreto y nunca se usa en builds de producción.

## Motivos de auditoría en formularios clínicos

Durante la captura inicial no se solicita una justificación al usuario. El
frontend envía `Guardado de borrador` al guardar y `Confirmación inicial de
ficha` al confirmar. Una corrección posterior debe usar un flujo separado y sí
solicitar un motivo explícito antes de modificar información ya confirmada.
Descartar un borrador también exige un motivo explícito: el backend cambia su
estado a `DESCARTADO`, conserva la auditoría y lo omite del listado operativo.

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

## Integración actual

Social, Legal, Referencias, Guardería y Evolución usan el mismo router institucional. Entrar desde el perfil de la beneficiaria. Configuración común: VITE_API_BASE_URL=/api/v1. VITE_DEV_CAPABILITIES=true habilita capacidades sintéticas solo en desarrollo; el build productivo conserva solo lectura para estas pantallas mientras se integra la sesión real. API local predeterminada: http://localhost:3000, mediante el proxy Vite.

Las decisiones pendientes y la verificación común se concentran en
`../docs/DECISIONES_Y_DUDAS.md` y `../docs/GUIA_TECNICA.md`.
