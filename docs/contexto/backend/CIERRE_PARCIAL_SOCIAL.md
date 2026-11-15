> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Estado de la reconstrucción de Trabajo Social

Actualizado el 13 de noviembre de 2026. Trabajo local; sin commit, push o PR. Este cierre es parcial: no equivale a módulo completo ni listo para producción.

## Implementado y comprobado

| Parte | Estado y evidencia |
| --- | --- |
| Mapeos | Entidades contrastadas con PostgreSQL local; sin modificar esquema o migraciones |
| Listado y resumen propios | Repositorios TypeORM; sin servicio heredado en SocialModule |
| Motor de formularios | Adaptador SOCIAL para creación, consulta, cursor, edición, confirmación y descarte; auditoría, versión, concurrencia y rollback comprobados |
| React | Páginas y API propias, cinco secciones, errores por campo, conservación de valores y enlaces históricos |
| PDF firmado | Enlace a Documentos, contexto autorizado, ficha precargada y control de confirmación en backend; carga real comprobada por HTTP |
| Postman | Social.postman_collection.json y entorno local; 30 peticiones, 65 comprobaciones aprobadas |
| Cobertura de rutas | 16 operaciones de los controladores Social, formularios comunes y Documentos contrastadas con la colección |
| Regresión | 58 pruebas de integración entre áreas aprobadas; última revisión general de código: 47 backend y 161 frontend aprobadas |

Los resultados de esta entrega corresponden a tres pruebas nuevas de estructura/cobertura y a la suite ampliada de integración. No se repitió innecesariamente la compilación de frontend: esta entrega solo añade colección, generador, pruebas de contrato/integración y documentación; no modifica código de aplicación.

## Archivos de la entrega Postman

| Archivo | Propósito |
| --- | --- |
| postman/Social.postman_collection.json | Flujo ejecutable del dominio con aserciones y variables encadenadas |
| postman/Social_Local.postman_environment.json | Entorno loopback sin secretos |
| postman/Social_README.md | Importación, ejecución y tabla de rutas |
| scripts/generar-postman-social.cjs | Generación reproducible de la colección |
| test/postman-social.contract.test.cjs | Scripts válidos, guard local y cobertura contra controladores compilados |
| test/areas.integration.cjs | Añade ejecución Newman real con AppModule/PostgreSQL |
| docs/contexto/backend/PLAN_RECONSTRUCCION_SOCIAL.md | Estado vigente del plan |
| docs/contexto/backend/CIERRE_PARCIAL_SOCIAL.md | Este informe |
| docs/DECISIONES_Y_DUDAS.md | Registra confirmación del SQL evolutivo pendiente |

## Pendientes que impiden declarar terminado todo Social

1. **Hoja evolutiva:** Eduardo confirmó que sigue pendiente otro SQL. La reconstrucción de captura y corrección no se adelanta. El resumen conserva una lectura acotada del esquema actual, que deberá contrastarse de nuevo cuando llegue el SQL.
2. **Autenticación y autorización productivas:** dependen del módulo responsable. Los contextos técnicos del laboratorio no son sesiones reales.
3. **Obligatoriedades y correcciones institucionales:** las reglas pendientes de D-04 no se resolvieron por interpretar imágenes o pruebas. La edición ordinaria implementada sigue siendo de borrador.
4. **Documento principal y revisión:** el PDF se vincula por formulario_id; no se asigna automáticamente firma_documento_id ni se convierte en documento VIGENTE. No se verifica digitalmente la firma manuscrita.
5. **Operación documental:** almacenamiento productivo y ciclo de vida siguen bajo D-03. Documentos conserva dependencias heredadas de su implementación común; no se presenta como reconstrucción global de ese módulo.
6. **Comprobación visual de carga completa:** Brave mostró el vínculo correcto, pero su extensión bloqueó la selección automática de archivos. La transferencia y asociación están probadas por HTTP; no se declara una carga manual completa en Brave.

## Información necesaria cuando llegue el SQL

Solicitar al encargado la versión definitiva, qué migración la aplica y los campos/relaciones que cambian en la hoja evolutiva. Ejemplo de mensaje:

> Para terminar la hoja evolutiva propia de Social, pásanos el SQL definitivo e indícanos qué cambia en entrada_evolutiva: relación con la ficha, acción, contenido, fecha de atención, profesional y auditoría. Así adaptamos el ORM y las pruebas sin alterar el trabajo de otras áreas.

No se requiere otra tabla por área si el esquema definitivo sigue separando las entradas por la ficha y su área. Esa relación debe verificarse en el SQL, sin asumirla a partir de la versión actual.
