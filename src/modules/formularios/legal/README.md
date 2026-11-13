# Legal

Ficha Legal y referencias de la beneficiaria, organizadas por módulo. No incorpora procesos legales de hijas o hijos.

## Organización

- LegalController → LegalService → LegalRepository: consultas y referencias.
- LegalFormRepository: persistencia TypeORM de la variante LEGAL, reutilizada por el motor común.
- dto/, entities/ y validation/: contratos, mapeos y validación del dominio.
- frontend/src/modules/legal/: páginas, configuración, API y hook del editor.

Legal no importa el módulo, servicio ni repositorio heredados de la asignación por integrante. Paginación, versiones, identificadores y transacciones auditadas viven en src/common/. Se conservan adaptadores de compatibilidad para no romper Social, Guardería, Evolución y las pruebas históricas; retirarlos completamente corresponde a la migración de esas áreas.

Las operaciones de Legal usan entidades y repositorios TypeORM, transacciones y bloqueo de cabecera. El SQL restante establece el contexto de auditoría de PostgreSQL. La edad histórica conserva su expresión PostgreSQL dentro de QueryBuilder. El recorrido de ficha Legal no usa SQL CRUD directo ni local_json_seguro.

## API

Prefijo /api/v1. Se conservan las seis rutas del módulo:

| Método | Ruta |
| --- | --- |
| GET | /legal/beneficiarias/:id/fichas |
| GET | /legal/beneficiarias/:id/referencias |
| POST | /legal/beneficiarias/:id/referencias |
| GET | /legal/referencias/:id |
| PATCH | /legal/referencias/:id |
| POST | /legal/referencias/:id/confirmar |

La ficha reutiliza estas rutas compartidas:

| Método | Ruta |
| --- | --- |
| GET / POST | /beneficiarias/:id/formularios-area, con tipo LEGAL |
| GET / PATCH | /formularios-area/:id |
| POST | /formularios-area/:id/confirmar |
| POST | /formularios-area/:id/descartar |
| GET | /tipos-formulario |

El motor delega únicamente la variante LEGAL al adaptador ORM; las demás conservan sus operaciones. Las referencias confirmadas admiten correcciones con motivo, versión e historial. La ficha Legal confirmada permanece en consulta en el flujo ordinario. No se agregan obligatoriedades o transiciones pendientes de D-04.

## Frontend

| Vista | Ruta |
| --- | --- |
| Listado de fichas | /beneficiarias/:id/legal |
| Nueva ficha | /beneficiarias/:id/legal/nueva |
| Consultar o continuar | /beneficiarias/:id/legal/:fichaId |
| Listado de referencias | /beneficiarias/:id/referencias |
| Nueva referencia | /beneficiarias/:id/referencias/nueva |
| Consultar o corregir referencia | /beneficiarias/:id/referencias/:fichaId |

Se mantienen las cuatro secciones del diseño: partes y fecha, diagnóstico y plan, proceso judicial y diligenciamiento. Actora proviene del perfil existente. La interfaz conserva los borradores ante fallos, exige confirmación explícita y bloquea escrituras tras un conflicto de versión. El descarte solicita motivo desde el listado, sin borrar datos.

La navegación utiliza el layout institucional y el menú de Legal, sin un menú por integrante. Los enlaces de Documentos y Hoja evolutiva conservan los módulos compartidos. La URL histórica de una ficha Legal redirige al editor del módulo.

## Integración y configuración

1. Usar Node.js 24 y pnpm 11.25.0 según CONTRIBUTING.md.
2. Verificar el esquema aprobado y las migraciones de database/migrations/ en el destino. Su presencia en Git no demuestra que estén aplicadas.
3. No se introducen migraciones ni sincronización automática. Deben existir las columnas de la ampliación y de 007_persona3_campos_mockups.sql, sus restricciones y auditoría. No renombrar una migración aplicada por su nombre histórico.
4. Configurar FORM_DRAFT_STATE_CODE, FORM_CONFIRMED_STATE_CODE y FORM_DISCARDED_STATE_CODE con códigos presentes en la base.
5. Mientras se integra la sesión, el motor usa AUDIT_ACTOR_USERNAME. Referencias conserva temporalmente P3_TEST_ACTOR_ID, P3_DRAFT_STATE y P3_CONFIRMED_STATE por compatibilidad. Los actores deben existir en usuario.
6. VITE_DEV_CAPABILITIES=true habilita capacidades sintéticas sólo en desarrollo. El build productivo conserva consulta hasta disponer de la sesión real.
7. Con la conexión autorizada en el entorno o .env, ejecutar:

```sh
pnpm run build:api
node scripts/check-legal-schema.cjs
```

El chequeo es de solo lectura: verifica columnas mapeadas, estados, variantes, actores técnicos y auditoría. No aplica migraciones ni acredita autenticación. D-02 y D-03 conservan sus pendientes de sesión y almacenamiento definitivo. Integrar esta rama no habilita por sí mismo escrituras productivas.

## Verificación reproducible

```sh
pnpm run check
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-legal.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-legal.ps1 -CoreRegression
```

El script requiere PostgreSQL local; usa PostgreSQL 18 por defecto. Crea un clúster desechable en loopback, aplica fixtures sintéticas y migraciones y detiene únicamente su servidor. No elimina directorios ni toca Neon o la base compartida. Los parámetros PostgresBin, Port y NodeExe permiten ajustar las herramientas.

Postman incluye las seis rutas de Legal y el flujo de ficha común:

```sh
pnpm exec newman run postman/Legal.postman_collection.json
```

La colección usa http://127.0.0.1:3000/api/v1, beneficiaria sintética 100 y profesional 1. Ejecutarla únicamente con la API conectada a una base de ensayo preparada. baseUrl permite seleccionar otro puerto local; la colección rechaza destinos fuera de loopback.

Las pruebas cubren consultas, creación, guardado, confirmación, descarte lógico,
correcciones de referencias, conflictos, auditoría y reversión. La regresión
ampliada comprueba errores, otras áreas, documentos y Albergue. Las pruebas de
interfaz cubren navegación, capacidades y conservación de valores ante fallos.

La autenticación productiva y la verificación del ambiente destino permanecen como responsabilidades compartidas. Las pruebas delimitan el alcance revisado y no acreditan esas piezas.
