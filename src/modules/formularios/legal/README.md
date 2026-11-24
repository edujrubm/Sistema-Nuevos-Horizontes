# Legal

Reconstrucción preparada localmente para revisión. Este archivo no acredita que se haya integrado en main ni desplegado.

## Organización

LegalController recibe HTTP; LegalService orquesta; LegalRepository y LegalFormRepository persisten mediante TypeORM. El adaptador se registra en el motor común sin importar Social o Guardería. Las excepciones de SQL de infraestructura para auditoría y edad histórica conservan su justificación y pruebas.

## Alcance

- Fichas y referencias de la beneficiaria; no procesos legales de hijos.
- Listados paginados con total e identificadores bigint como cadenas.
- Creación, reapertura, validación por campo, control de versión y auditoría transaccional según los estados y reglas existentes.
- Referencias: consulta, creación, edición, confirmación y correcciones con motivo e historial.
- Adjuntos PDF mediante el módulo existente de Documentos.
- Rutas React propias en frontend/src/modules/legal/routes.tsx. El editor y los listados no importan pantallas de otras áreas.

## API

GET /api/v1/legal/beneficiarias/:id/fichas
GET y POST /api/v1/legal/beneficiarias/:id/referencias
GET y PATCH /api/v1/legal/referencias/:id
POST /api/v1/legal/referencias/:id/confirmar

La ficha LEGAL usa además los endpoints publicados del motor de formularios.

## Integración

Se aplica únicamente sobre la base común revisada. No requiere instalar la reconstrucción de Social ni de Guardería y no agrega migraciones. Verificar el esquema realmente aplicado en el ambiente destino. Las pruebas específicas están en test/legal-orm.integration.cjs y scripts/test-legal.ps1; incluyen React, HTTP y PostgreSQL real desechable. El fixture contiene un profesional sintético 67; no crea una cuenta autenticada.

Siguen pendientes autenticación/autorización definitivas, despliegue y la nueva hoja evolutiva, a la espera del SQL aprobado. No activar sincronización automática del ORM ni ejecutar los fixtures en una base compartida.

## Convención del cliente

La reconstrucción React usa apiRequest y ApiError.body de shared/api, junto con useQuery, useMutation y el QueryClient de la aplicación. Las claves separan área, beneficiaria y recurso; las mutaciones no se reintentan automáticamente. La conservación de borradores y el bloqueo de escrituras inciertas mantienen el comportamiento probado. No se agregan campos, estados ni cambios de diseño.
