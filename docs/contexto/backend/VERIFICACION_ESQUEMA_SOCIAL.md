> Registro de una etapa de reconstrucción. El estado vigente, los resultados nuevos y las condiciones de integración están en [INTEGRACION_SOCIAL.md](../../INTEGRACION_SOCIAL.md).

# Verificación del esquema de Trabajo Social

## Alcance

Paso 2 de la reconstrucción, realizado el 13 de noviembre de 2026 sobre PostgreSQL de ensayo en loopback, puerto 55485. Se consultaron exclusivamente metadatos mediante una transacción REPEATABLE READ y READ ONLY. No se aplicaron migraciones ni se consultaron expedientes personales. Esta evidencia no acredita el esquema de Neon ni producción.

## Resultado

Se compararon 66 columnas mapeadas de FichaSocial, FormularioAreaEntity, BeneficiariaEntity, ExpedienteEntity y los catálogos de área, estado y profesional. Se verificaron presencia, tipo, nulabilidad y longitud explícita. La ejecución final no encontró diferencias entre esos mapeos y la base local.

Los 17 campos del detalle Social existen y admiten NULL. `formulario_id` es su llave primaria. El discriminador `tipo` está protegido por CHECK SOCIAL, tiene valor predeterminado SOCIAL y forma una llave foránea compuesta con la cabecera; no se añadió un segundo discriminador editable en la entidad. La relación de coordinación apunta a `area.id_area`.

La cabecera conserva relaciones con expediente, profesional, capturista, estado y tipo/área. Su CHECK impide asociar un niño a SOCIAL. El expediente mantiene unicidad por beneficiaria. Los triggers de auditoría están activos en cabecera y detalle; también existen protección de origen, prohibición de borrado y propagación de versión desde el detalle. Por tanto, las futuras escrituras no deben incrementar manualmente una versión que ya actualiza el trigger.

## Correcciones aplicadas

| Archivo | Corrección | Motivo |
| --- | --- | --- |
| shared/entities/formulario-catalogos.entity.ts | nombre_area se mapea como varchar(60), nullable | Coincidir con el catálogo existente sin alterar su tabla |
| shared/contracts/formulario-area-row.ts | area admite string o null | Reflejar lo que puede devolver ese catálogo sin inventar un nombre sustituto |
| social/dto/ficha-social.dto.ts | areaCoordinacionId reutiliza IsPgId | Rechazar identificadores superiores al máximo bigint antes de llegar a PostgreSQL |
| social/dto/ficha-social.dto.spec.ts | Casos opcionales, límites y formatos inválidos | Verificar el borde del identificador y preservar null/ausencia |
| scripts/check-social-schema.cjs | Diagnóstico reproducible de metadatos | Impedir conexión accidental fuera de loopback y conservar evidencia sin datos personales |

El ajuste del catálogo es compartido con Legal. No modifica respuestas JSON existentes: corrige su descripción TypeScript para reconocer null, que la base ya permitía. No se cambiaron tablas, migraciones, estados, obligatoriedades institucionales ni pantallas.

## Validación

- Compilación TypeScript del backend: aprobada.
- Jest: 11 suites y 47 pruebas aprobadas, cero fallos; incluye diez casos nuevos del DTO de Social.
- Comprobación de metadatos: 66 columnas, cero diferencias finales; restricciones y triggers recogidos en la evidencia local.
- Evidencias ignoradas: test-results/social-schema.json y test-results/social-step2-backend.json.

Para repetir: compilar el backend y ejecutar `node scripts/check-social-schema.cjs` indicando explícitamente SOCIAL_TEST_HOST (loopback), SOCIAL_TEST_PORT, SOCIAL_TEST_DATABASE, SOCIAL_TEST_USER y SOCIAL_TEST_PASSWORD. Estos nombres reutilizan la conexión del laboratorio ya existente; el diagnóstico no carga .env ni configura una conexión compartida. No imprimir secretos ni incluirlos en Git.

No se ejecutó todavía un flujo de persistencia Social reconstruido: corresponde a las siguientes tareas. No se hizo commit, push ni PR.

## Lo que sigue

Paso 3: SocialRepository y SocialService propios. Primero el listado TypeORM con filtro de expediente/tipo, orden estable, paginación y total, conservando la ruta pública. Después el resumen, manteniendo explícitas las decisiones pendientes de riesgos y la dependencia de seguimientos. La hoja evolutiva permanece al final.
