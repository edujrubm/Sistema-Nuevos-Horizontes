# Guardería

Reconstrucción preparada localmente para revisión; no se declara integrada en main ni desplegada.

## Organización

Controladores HTTP, servicios de casos de uso y repositorios TypeORM propios. El adaptador de fichas se registra en la infraestructura compartida. No se importan servicios ni pantallas de Legal o Social. Las rutas React son públicas desde frontend/src/modules/guarderia/routes.tsx.

La entidad padre_nino pertenece a entities/padre-nino.entity.ts dentro de este módulo. El niño existente se consulta mediante la exportación pública de Niños; la madre y el número de ficha inicial proceden del perfil del expediente. No se modifica la captura de ficha inicial.

## Alcance

- Listar niños del expediente y fichas; la ficha GUARDERIA confirmada identifica inscripción.
- Capturar, reabrir y guardar la ficha con controles de versión, validación y auditoría según las reglas existentes.
- Responsables adicionales: nombre, CUI, relación y teléfono. Su registro autoriza recogida/traslado conforme a la decisión aprobada; no se infiere esa autorización por paternidad.
- Padre biológico y legal: datos personales opcionales, vínculo al niño y correcciones con motivo, versión e historial.
- Adjuntos PDF mediante Documentos. La nueva hoja evolutiva sigue pendiente del SQL definitivo.

## API propia

GET /api/v1/guarderia/beneficiarias/:id/hijos
GET /api/v1/guarderia/hijos/:id/fichas
GET y POST /api/v1/guarderia/beneficiarias/:beneficiariaId/fichas/:formularioId/responsables
PATCH en la ruta anterior seguida de /:responsableId
GET y POST /api/v1/guarderia/beneficiarias/:beneficiariaId/hijos/:ninoId/padres
PATCH en la ruta anterior seguida de /:padreId

La ficha utiliza también los endpoints del motor común de formularios.

## Migraciones y pruebas

Requiere base común y revisión de 010_guarderia_responsables.sql y 011_padre_nino.sql. No modifica migraciones históricas, no recrea tablas del proyecto y no activa synchronize. Deben aplicarse una sola vez por el encargado de BD, con respaldo y verificación del estado real del ambiente.

Pruebas: test/guarderia-consultas.integration.cjs y test/padres-consultas.integration.cjs; ejecutores scripts/test-guarderia-consultas.ps1 y scripts/test-padres-consultas.ps1. Usan datos sintéticos y PostgreSQL local desechable.

No requiere instalar los paquetes de Legal o Social. La autenticación y autorización productivas siguen pendientes: el contexto técnico local de las pruebas no las sustituye.

## Convención del cliente

La reconstrucción React usa apiRequest y ApiError.body de shared/api, junto con useQuery, useMutation y el QueryClient de la aplicación. Las claves separan área, beneficiaria y recurso; las mutaciones no se reintentan automáticamente. La conservación de borradores y el bloqueo de escrituras inciertas mantienen el comportamiento probado. No se agregan campos, estados ni cambios de diseño.
