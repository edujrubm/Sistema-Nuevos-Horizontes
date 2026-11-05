# Frontend de Persona 3

React + Vite + TypeScript, aislado del backend. Referencia de alcance: F3-01..08 y FX-04 del plan del 4 de noviembre. Las API se consumen desde shared/api/persona3.ts sobre el motor y los controladores reales integrados; no hay respuestas sintéticas en el build.

## Ejecutar

Desde la raíz: pnpm install --frozen-lockfile. Después pnpm --dir frontend dev. Vite escucha en 127.0.0.1:5173 y envía /api a la API local de 127.0.0.1:3016. El proxy es solo desarrollo. Para el build, el servidor de despliegue debe enrutar /api o se debe configurar VITE_API_BASE con el acuerdo de CORS del equipo.

API y BD sintética aisladas: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-persona3.ps1 -Port 55462 -ApiPort 3016 -Area Legal. Requiere PostgreSQL 18 instalado y los binarios indicados en el script; no usa la BD del grupo.

Para probar escrituras localmente, antes de iniciar Vite definir VITE_DEV_CAPABILITIES=true. Esta opción solo funciona con import.meta.env.DEV; nunca habilita acciones en el build de producción. El área de escrituras de P3 la define el servidor; para probar Social/Guardería reiniciar la API con -Area correspondiente.

En pruebas sintéticas: beneficiaria 100, profesional 1. Los IDs son texto, no números JavaScript. No usar datos reales.

## Rutas del cliente (createHashRouter)

- /beneficiarias/:beneficiariaId: accesos del expediente.
- /beneficiarias/:beneficiariaId/social: resumen y fichas sociales.
- /beneficiarias/:beneficiariaId/social/nueva: borrador Social mínimo.
- /beneficiarias/:beneficiariaId/legal: fichas legales.
- /beneficiarias/:beneficiariaId/fichas/:fichaId: consulta/edición de borrador mediante motor compartido.
- /beneficiarias/:beneficiariaId/referencias: referencias legales.
- /beneficiarias/:beneficiariaId/referencias/nueva y /:fichaId: alta/detalle/corrección/confirmación.
- /beneficiarias/:beneficiariaId/guarderia y /:hijoId: selección de inscritos y fichas.
- /beneficiarias/:beneficiariaId/evolucion: entradas, corrección e historial.

## Interfaces para integrar

App recibe capacidades tipadas por props; CapacidadesContext las comparte. Por defecto todas las acciones de escritura/historial están deshabilitadas. La sesión real debe pasar estos valores; no inferirlos por rol. El backend debe autorizar los recursos en la integración definitiva.

shared/api/http.ts centraliza timeout, cancelación, errores de cinco claves y requestId. No reintenta POST/PATCH ni almacena datos sensibles en localStorage. El catálogo español proviene del backend: node -r ts-node/register scripts/generate-error-catalog.cjs desde la raíz para regenerarlo tras cambiar el catálogo.

Las fichas del motor se adaptan desde {data}; los listados P3 usan {datos,pagina,limite,total}. Las fechas viajan ISO y se muestran en America/Guatemala. Los valores de fecha/hora capturados corresponden a la zona del equipo del operador y se convierten a ISO; configurar la zona del equipo correctamente.

components/feedback.tsx contiene feedback común. styles/tokens.css contiene la paleta institucional y escala; debe revisarse con un consumidor del equipo antes de sustituir los tokens comunes. Los módulos se cargan bajo demanda. useCambiosPendientes usa useBlocker sobre un data router y beforeunload; al integrar debe conservarse esta protección.

La UI documental corresponde a Persona 4; el contrato único y su colección están documentados en docs/integracion/INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md.

## Verificación

pnpm --dir frontend check: typecheck, pruebas y build. No modifica src/ del backend. Los tests usan adaptadores simulados de forma explícita; la comprobación real React/API/BD se documenta por separado.

Pendientes de coordinación y límites: ../docs/integracion/DUDAS_EQUIPO_FRONTEND.md. No afirmar integración completa con el frontend ajeno que todavía no está publicado.

## Referencia visual vigente

El diseño se rige por los mockups del ZIP 2026-10-16 (1).zip. Consultar ../docs/integracion/AJUSTE_VISUAL_MOCKUPS_20261104.md. MarcoFicha conserva la navegación y el progreso; secciones.ts define el orden de cada área. Las referencias originales están en docs/referencias-mockups y no se ejecutan como páginas de producción.
