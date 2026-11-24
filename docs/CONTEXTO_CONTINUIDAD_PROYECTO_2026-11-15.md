# Sistema Nuevos Horizontes — contexto de continuidad

Fecha de corte: 15 de noviembre de 2026  
Repositorio: `https://github.com/edujrubm/Sistema-Nuevos-Horizontes`  
Rama integrada actual: `main`  
Ruta local de integración: `C:\Users\tzica\Documents\Codex\2026-10-24\hola-como-est-s-consultar-contexto\work\Sistema-Nuevos-Horizontes`

## Propósito del documento

Este archivo permite continuar el trabajo en otro chat sin reconstruir el contexto. El proyecto es un monolito con backend NestJS/TypeORM/PostgreSQL y frontend React/TypeScript dentro del mismo repositorio. El frontend se trabaja de forma aislada por módulos, pero se integra en el mismo `main`; no debe tratarse como microservicios independientes.

## Estado actual

`main` está limpio y sincronizado con `origin/main`.

Últimos commits relevantes:

- `3259a56 fix: incluye DTO para registrar hijas e hijos`
- `332fd3b feat: integra ficha inicial y registro de hijos`
- `1eac193 Definición de buenas practicas para código limpio`
- `97bdacc fix(frontend): organizar resumen de albergue en horizontal`

Se eliminó del commit integrado el archivo de evidencia que no había sido solicitado.

## Ramas de trabajo

- `main`: integración estable.
- `beneficiarias`: backend de Persona 1: ficha inicial, errores API y registro de hijas/hijos.
- `feat/frontend-persona1-beneficiarias`: frontend de Persona 1: ficha inicial y perfil de beneficiaria.
- `feat/frontend-persona4-albergue-panel`: frontend del módulo Albergue.

Antes de iniciar trabajo nuevo, consultar siempre el estado remoto:

```cmd
cd /d "C:\Users\tzica\Documents\Codex\2026-10-24\hola-como-est-s-consultar-contexto\work\Sistema-Nuevos-Horizontes"
git status
git switch main
git pull --ff-only origin main
```

No usar GitHub Actions. Los merges deben revisarse localmente y publicarse con Git normal.

## Arquitectura

### Backend

- NestJS 11.
- TypeORM 0.3.
- PostgreSQL mediante `pg`.
- `synchronize` debe permanecer desactivado.
- Validación con `class-validator` y `class-transformer`.
- Swagger y prefijo de API `/api`.
- Código backend en `src/`.
- Migraciones y SQL controlado en `database/`.

El backend usa TypeORM para entidades, repositorios y persistencia, pero conserva SQL explícito en consultas complejas, auditoría, vistas lógicas y funciones PostgreSQL. No convertir consultas a ORM automáticamente sin revisar el contrato y el rendimiento.

### Frontend

- React 19 + TypeScript.
- Vite.
- React Router.
- TanStack React Query.
- React Hook Form y Zod donde corresponde.
- Código en `frontend/src/`.
- El proxy de Vite apunta al backend local en `http://localhost:3000`.

## Módulos principales

### Persona 1 — ficha inicial y beneficiarias

Incluye:

- Wizard de ficha inicial con ocho pasos.
- Guardado al avanzar; el botón principal es `Siguiente`.
- Botón `Actualizar` para modificar una página previamente guardada.
- Validación antes de permitir avanzar.
- Detección de duplicados por DPI/CUI desde el primer paso.
- Catálogos para estado civil, etnia, escolaridad, países y ocupaciones.
- Campos condicionales `Otra` que muestran texto adicional sin desplazar agresivamente el formulario.
- Validación de DPI/CUI de Guatemala con 13 dígitos.
- Personas agresoras con documento, edad, ocupación, ingreso, trabajo y horario de inicio/fin.
- Secciones de familia, violencia, riesgo, referencias y cierre alineadas con el formulario fuente.
- Perfil de beneficiaria con registro de hijas e hijos.

Backend Persona 1:

- `src/modules/ficha-inicial/`
- `src/modules/ninos/`
- `src/common/errors/errores.filter.ts`

El DTO requerido para crear hijas/hijos es:

`src/modules/ninos/dto/crear-nino.dto.ts`

No eliminarlo: el controlador, servicio y repositorio lo importan.

### Persona 4 — Albergue

El frontend del módulo incluye ingreso, salidas/retornos, egreso/nacimiento e historial de movimientos. Se ajustó el panel de resumen para aprovechar el espacio horizontal. El backend de Albergue no debe modificarse salvo autorización explícita; el trabajo realizado fue principalmente de integración y presentación frontend sobre el contrato existente.

## Comandos de ejecución

Desde la raíz del repositorio:

```cmd
pnpm install
pnpm dev:api
```

En otra terminal CMD:

```cmd
cd /d "C:\Users\tzica\Documents\Codex\2026-10-24\hola-como-est-s-consultar-contexto\work\Sistema-Nuevos-Horizontes"
set "VITE_DEV_PROFESSIONAL_ID=2"
pnpm dev:web
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`

En PowerShell, el equivalente de la variable es:

```powershell
$env:VITE_DEV_PROFESSIONAL_ID = "2"
pnpm dev:web
```

## Verificación recomendada

```cmd
pnpm run build:api
pnpm run typecheck:web
pnpm exec jest src/modules/ninos/ninos.service.spec.ts src/modules/ficha-inicial/ficha-inicial.service.spec.ts --runInBand
git diff --check
git status
```

No existe un script `typecheck:api`; para el backend se usa `pnpm run build:api` o `pnpm exec tsc -p tsconfig.json --noEmit`.

## Problemas conocidos y soluciones

### `Cannot find module './dto/crear-nino.dto'`

Se corrigió agregando y publicando `src/modules/ninos/dto/crear-nino.dto.ts` en `beneficiarias` y `main`. Si aparece en otra computadora, hacer `git pull --ff-only origin main` y verificar que el archivo exista con:

```cmd
dir src\modules\ninos\dto\crear-nino.dto.ts
```

### `ERR_PNPM_IGNORED_BUILDS` o errores EPERM de symlink

Son problemas del entorno local de pnpm/permisos, no necesariamente del código. Ejecutar la instalación en una terminal normal de Windows y aprobar únicamente los builds solicitados por pnpm si corresponde. No modificar código para ocultar ese error.

### `QueryFailedError` PostgreSQL `42883`

Indica una función PostgreSQL ausente o incompatible, especialmente `new_horizons.local_json_seguro(jsonb)`. Verificar que la conexión apunta a la base correcta y aplicar la función/migración en la base de pruebas antes de cambiar backend.

### `42P01`

Indica tabla o relación inexistente en la base conectada. Revisar migraciones aplicadas y la base indicada en `.env`; no crear tablas manualmente sin confirmar el esquema.

### `SOLICITUD_INCOMPLETA` al confirmar ficha

La API exige que las secciones obligatorias estén guardadas. Revisar que cada paso se haya persistido y que el frontend no omita campos opcionales enviados como `undefined` cuando el contrato requiere una sección existente.

### `VERSION_DESACTUALIZADA`

Conflicto optimista: el borrador cambió entre lectura y actualización. Recargar el borrador y volver a guardar; no desactivar el control de versión.

### Error React `Rendered more hooks than during the previous render`

Todos los hooks deben ejecutarse siempre en el mismo orden. No colocar `useMutation`, `useQuery`, `useState` o `useEffect` después de retornos condicionales.

## Reglas de trabajo

1. Hacer `git pull --ff-only` antes de empezar.
2. Confirmar la rama correcta antes de editar.
3. Mantener backend y frontend separados por rama cuando el trabajo sea de una persona, pero integrar ambos en `main` al finalizar.
4. No tocar backend de Albergue cuando el cambio solicitado sea únicamente frontend.
5. No borrar campos del contrato o de la ficha sin verificar primero el PDF/mockup y la API.
6. No introducir archivos de evidencia, resultados temporales o `test-results/` en commits salvo petición explícita.
7. Antes de publicar: `git diff --check`, compilación correspondiente y pruebas puntuales.
8. Para resolver conflictos, revisar archivo por archivo; no usar `git checkout --theirs` indiscriminadamente si ambas ramas tienen cambios válidos.

## Documentación de referencia

Contexto general:

`C:\Users\tzica\Documents\Codex\2026-11-03\contexto-actual-proyecto.md`

Backend:

`C:\Users\tzica\Documents\Codex\2026-10-16\ho\outputs\contexto-backend`

Frontend:

`C:\Users\tzica\Documents\Codex\2026-10-16\ho\outputs\contexto-frontend`

Base de datos:

`C:\Users\tzica\Documents\Codex\2026-10-24\hola-como-est-s-consultar-contexto\outputs\base-datos-unificada-v2`

ORM:

`C:\Users\tzica\Documents\Codex\2026-10-24\hola-como-est-s-consultar-contexto\outputs\contexto-orm-proyecto.md`

Mockups:

`C:\Users\tzica\Documents\Codex\2026-10-16\ho\outputs`

Plan frontend/Kanban:

`C:\Users\tzica\Documents\Codex\2026-11-03\indice-de-contexto-para-un-nuevo\output\pdf\Nuevos_Horizontes_Plan_Frontend_Kanban.pdf`

## Próximos pasos sugeridos

- Confirmar que todos los compañeros actualicen desde `origin/main`.
- Probar en una segunda computadora la instalación limpia y la compilación backend/frontend.
- Validar que las migraciones de PostgreSQL estén aplicadas en el entorno de pruebas.
- Completar pruebas de integración de ficha inicial contra la base real.
- Continuar frontend de módulos pendientes sin modificar contratos backend ajenos.
