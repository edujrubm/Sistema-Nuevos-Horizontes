# Trabajo Social

Reconstrucción preparada localmente para revisión; no se declara integrada en main ni desplegada.

SocialController recibe HTTP; SocialService orquesta; los repositorios del área implementan consultas, resumen y persistencia con TypeORM. La lectura de Evolución se usa por su interfaz pública. El motor común no importa repositorios privados de Social.

## Alcance

Ficha social, cabecera de la beneficiaria, historia de violencia, diagnóstico, riesgos y planes conforme a los campos y decisiones aprobadas. Incluye borradores, reapertura, validación por campo, control de versión, auditoría y adjuntos PDF mediante Documentos. La firma se realiza en papel y se carga el PDF; no se implementa firma digital nueva. La reconstrucción de seguimiento espera el SQL definitivo de hoja evolutiva.

GET /api/v1/trabajo-social/beneficiarias/:id/resumen
GET /api/v1/trabajo-social/beneficiarias/:id/fichas

Las escrituras de la ficha SOCIAL utilizan los endpoints del motor compartido. Las rutas React pertenecen a frontend/src/modules/social/routes.tsx.

## Independencia y pruebas

Se aplica sobre la base común, sin instalar Legal ni Guardería reconstruidos. Sus fixtures son propios: el registro sintético de otro tipo permite comprobar aislamiento, sin ejecutar código del paquete de otra área.

Test y ejecutor: test/social-listado.integration.cjs, test/social-postman.integration.cjs y scripts/test-social.ps1. Incluyen ORM, auditoría, PDF, React con HTTP real y la colección Social de Newman. Los datos son ficticios y sólo se ejecutan en PostgreSQL local desechable. No agrega migraciones.

No resuelve autenticación productiva ni reglas institucionales que sigan pendientes en el registro de decisiones.

## Convención del cliente

La reconstrucción React usa apiRequest y ApiError.body de shared/api, junto con useQuery, useMutation y el QueryClient de la aplicación. Las claves separan área, beneficiaria y recurso; las mutaciones no se reintentan automáticamente. La conservación de borradores y el bloqueo de escrituras inciertas mantienen el comportamiento probado. No se agregan campos, estados ni cambios de diseño.
