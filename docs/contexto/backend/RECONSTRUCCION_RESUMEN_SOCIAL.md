> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Reconstrucción del resumen de Trabajo Social

Fecha: 13 de noviembre de 2026. Continuación autorizada por Eduardo del plan de reconstrucción. Todo permanece local; no se hizo commit, push ni PR.

## Resultado

La ruta `GET /api/v1/trabajo-social/beneficiarias/:id/resumen` usa ahora SocialController, SocialService y SocialResumenRepository. SocialModule ya no importa el núcleo heredado organizado por integrantes. El código y README del área, junto con la nueva interfaz de lectura, no contienen referencias a esa distribución de trabajo.

Se conserva la respuesta: beneficiariaId, expedienteId, totalFichas, ultimaAtencion, beneficiaria, ultimaFicha, historialReciente, camposSinSoporte y totalRiesgos. La última ficha conserva detalle anidado y sus campos planos, profesional, estado, fecha y versión. Se mantiene el orden por atención e identificador descendentes y la inclusión histórica de estados del contrato anterior.

El CUI se devuelve únicamente enmascarado. La edad sigue calculándose con la fecha civil de Guatemala en PostgreSQL. El resumen vacío devuelve última ficha/atención nulas e historial vacío solo cuando realmente no existen registros. La última ficha se consulta con límite uno; el historial, con límite cinco.

Las lecturas usan repositorios y QueryBuilder de TypeORM dentro de una transacción REPEATABLE READ. Los cálculos de edad, máscara y agregados son expresiones fijas de PostgreSQL dentro del repositorio; no hay llamadas query(...) para CRUD ni nombres de tabla recibidos desde HTTP. getRawOne/getRawMany devuelven proyecciones del QueryBuilder; no son ejecución de una cadena SQL completa mediante manager.query.

## Intercambio con Evolución

La información de seguimiento pertenece a Evolución. Para no copiar su acceso a datos dentro de Social, se añadió una interfaz pública de consulta en `src/modules/evolucion/lectura`. Lee la tabla existente con entidades ORM, filtra por expediente y tipo SOCIAL y comparte el EntityManager de la instantánea del resumen.

Esto no reconstruye el flujo de captura o corrección de la hoja evolutiva, no crea endpoints nuevos, no escribe seguimientos y no cambia su esquema. Ese trabajo sigue diferido. Tampoco sustituye la autorización productiva: esta consulta interna no publica una ruta independiente.

## Riesgos pendientes

El esquema base vigente almacena riesgos como texto. El resumen devuelve totalRiesgos=null y camposSinSoporte=["totalRiesgos"]. No cuenta palabras ni instala el catálogo experimental de la propuesta local. Frente a una base con ese experimento, no se acredita soporte del conteo estructurado; su decisión y esquema siguen pendientes en D-05.

## Archivos de esta entrega

| Archivo | Cambio |
| --- | --- |
| src/modules/formularios/social/repositories/social-resumen.repository.ts | Repositorio propio del resumen, identidad protegida, métricas y última ficha |
| src/modules/formularios/social/dto/resumen-social.dto.ts | Representación de salida tipada |
| src/modules/formularios/social/social.service.ts | Caso de uso consultarResumen |
| src/modules/formularios/social/social.controller.ts | Resumen conectado al servicio propio; elimina la inyección anterior |
| src/modules/formularios/social/social.module.ts | Retira el módulo anterior, registra repositorio y consume la interfaz pública de lectura |
| src/modules/formularios/social/README.md | Corrige la arquitectura descrita y los límites reales |
| src/modules/evolucion/lectura/entrada-evolutiva-lectura.entity.ts | Proyección de lectura del esquema existente |
| src/modules/evolucion/lectura/evolucion-lectura.module.ts | Proveedor público de los cinco seguimientos Social más recientes y su módulo |
| src/modules/evolucion/lectura/index.ts | Exportaciones públicas para evitar importar repositorios privados |
| src/modules/formularios/shared/entities/formulario-catalogos.entity.ts | Mapea nombre del profesional desde empleado.nombre, varchar(60) obligatorio |
| scripts/check-social-schema.cjs | Añade la proyección de seguimiento a la comprobación de metadatos |
| test/fixtures/social.sql | Datos sintéticos de identidad y seguimiento para probar máscara, límites y aislamiento |
| test/social-listado.integration.cjs | Amplía las pruebas reales con el resumen y sus casos sin datos/error |
| docs/contexto/backend/PLAN_RECONSTRUCCION_SOCIAL.md | Registra cierre del paso 3 y estado actual |
| docs/contexto/backend/RECONSTRUCCION_RESUMEN_SOCIAL.md | Este informe |

## Evidencia

- PostgreSQL/HTTP: 17 pruebas aprobadas, cero fallos, ejecutando SocialModule real en el servidor desechable del ensayo.
- El resumen devuelve última ficha y cinco entradas ordenadas; no mezcla seguimientos de Legal ni de otra beneficiaria.
- CUI completo ausente de la respuesta; datos opcionales nulos preservados; expediente sin fichas y expediente inexistente comprobados.
- Verificación de esquema local: 75 columnas mapeadas, cero diferencias finales.
- pnpm run check: tipos frontend, 47 pruebas backend, 147 frontend y compilaciones API/web aprobados. La extracción posterior del tipo de salida también se compiló y se repitieron las 17 pruebas PostgreSQL/HTTP.
- Evidencias ignoradas: test-results/social-resumen-check.log, test-results/social-listado.integration.tap y test-results/social-schema.json.

No se cambiaron migraciones ni se escribieron datos en la base compartida o en el entorno de pantallas abierto para el usuario. Las escrituras del fixture se hicieron únicamente en el clúster desechable del ensayo. No se afirma que el código nuevo esté activo en las ventanas de demostración anteriores.

## Siguiente paso

Paso 4: implementar el adaptador ORM de Social para el motor común de formularios, con cabecera y detalle atómicos, auditoría y control de versión. Creación, edición, confirmación y descarte aún no se dan por reconstruidos. Las reglas institucionales pendientes y la autenticación siguen explícitas. Después se separarán las páginas React de Social conservando el diseño.
