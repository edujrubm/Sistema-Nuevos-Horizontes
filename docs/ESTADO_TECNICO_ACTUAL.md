# Estado técnico comprobado

Fecha de revisión documental: 29 de octubre de 2026.

Este documento separa el estado que puede comprobarse en el repositorio del
estado operativo que requiere una verificación nueva contra PostgreSQL. Evita
usar documentación anterior a Persona 1 como si describiera el checkout actual.

## Evidencia del repositorio

La rama `beneficiarias` está en el commit `9303f97` (`feat: implement children
and initial intake workflows`). Incluye los commits previos `3b80351`,
`c017552`, `8402806` y `9303f97`, que implementan el alcance de Persona 1:

- consultas, alta, edición, inactivación, reactivación e historial de
  beneficiarias y expedientes;
- catálogos geográficos y catálogos permitidos;
- alta, consulta, edición, inactivación y reactivación de hijos;
- borrador, secciones y confirmación de ficha inicial;
- migraciones y datos sintéticos de apoyo.

Las migraciones SQL versionadas actualmente son:

1. `database/migrations/003_persona1_soporte_operativo.sql`
2. `database/migrations/004_ninos_estado_operativo.sql`
3. `database/migrations/005_ficha_inicial_borrador_unico.sql`
4. `database/migrations/006_nino_cui_unico.sql`

También existe `database/seeds/001_persona1_datos_sinteticos.sql`. No contiene
datos institucionales reales.

El backend usa NestJS 11, TypeORM 0.3 y PostgreSQL. El acceso mantiene
`synchronize: false` y `migrationsRun: false`; los scripts SQL versionados son
la vía de cambio del esquema. Los identificadores `bigint` se representan como
`string` en TypeScript.

## Qué no afirma este documento

- Que estas migraciones sigan aplicadas en una instancia concreta de
  PostgreSQL: eso requiere conectarse y comprobar el historial y el esquema.
- Que el DDL unificado v2 de formularios (`02_ampliacion_formularios.sql`) esté
  desplegado. Sigue pendiente de ejecución y validación independiente.
- Que autenticación, autorización por capacidad y ámbito, frontend React,
  formularios de área, documentos, albergue, reportes o administración estén
  implementados. Son fases posteriores.
- Que las pruebas históricamente reportadas sustituyan una ejecución actual.

## Cómo usar el contexto anterior

Las referencias antiguas a “sin archivos SQL” o “base no verificada” describen
el estado anterior a los commits de Persona 1. Para trabajo nuevo, usar este
archivo junto con el código y las migraciones actuales. Las advertencias sobre
el DDL v2 y sobre la falta de verificación actual de la base continúan vigentes.
