# Entrega para integrar a main

Fecha: 4 de noviembre de 2026.

## Ramas y revisión

- Repositorio: https://github.com/edujrubm/Sistema-Nuevos-Horizontes
- Entrega conjunta: rama existente `schema-persona3`, propuesta hacia `main`.
- Solicitud de integración: https://github.com/edujrubm/Sistema-Nuevos-Horizontes/pull/15 (abierta para revisión; no fusionada).
- Limpieza independiente: rama existente `medicina`; se publica únicamente la retirada de caché sobre su versión actual, sin incluirla en la propuesta conjunta.
- No se crean ramas remotas adicionales ni se modifica directamente `main`. No se ejecutan cambios en la base compartida.
- La entrega conjunta parte de `main` en `441eda41853607a302aebadbcf8dfe9981e43ca8` e integra el trabajo previo de Persona 3. Las propuestas anteriores de Legal, Social, Guardería y Evolución se deben comparar con esta entrega antes de fusionarlas: no integrar indiscriminadamente versiones antiguas después de la unificación.

## Qué se entrega

| Parte | Cambios |
|---|---|
| Documentos | Un solo módulo: carga directa multipart de PDF, listado paginado, metadatos, descarga privada verificada, versiones y anulación lógica con motivo y versión. Sin conversión de imágenes ni rutas duplicadas de carga. |
| Backend Persona 3 | Fichas Social, Legal y Guardería; referencias; evolutivas del área; confirmación y correcciones con historial. Legal atiende a la beneficiaria; Guardería requiere inscripción mediante ficha confirmada. |
| Integración con main | Prefijo `/api/v1`, validación y errores unificados en español; compatibilidad con Beneficiarias y el motor compartido. Validación de referencias también por las rutas alternativas del motor. |
| React | Vistas funcionales de Social, Legal, referencias, Guardería y evolutivas basadas en los mockups originales, con guardado, confirmación, errores y protección de borradores. Navegación institucional; no existe un menú exclusivo de Persona 3. |
| Base de datos | Migración 007 de campos de formularios y propuesta 008 documental. Los cambios experimentales de riesgos, asignaciones y cierre están separados en `docs/propuestas/009_mockups_laboratorio.sql`; no se activan. |
| Postman | Colecciones Persona3, errores, carga PDF y plantillas Documentos_Unificados, con entorno e instrucciones locales. |
| Higiene | Runtime sin laboratorio; dependencias y compilación de frontend separadas; sin credenciales, cargas privadas, exportaciones de BD ni resultados locales de pruebas versionados. |
| Medicina, entrega separada | Eliminación de 96 archivos de caché Jest y exclusión mediante `.gitignore`. No cambia la lógica clínica. |

## Pruebas

Se vuelven a ejecutar para publicar: 23 pruebas React, comprobación TypeScript y build productivo; 20 pruebas unitarias de main; 47 pruebas de backend e integración sobre PostgreSQL local aislado, sin el SQL experimental. Total: 90 pruebas de código.

La evidencia anterior de Postman incluye 18 peticiones y 29 aserciones sin fallos; no equivale a una validación completa de todos los módulos del grupo. En esta publicación no se repite Newman ni se certifican los endpoints clínicos de Medicina.

Comandos reproducibles desde la raíz:

```powershell
pnpm install --frozen-lockfile
pnpm test --runInBand
pnpm --dir frontend check
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-persona3.ps1 -Port 55461 -SinLaboratorio
```

## Qué debe revisar el encargado antes de fusionar

1. Revisar el diff de la propuesta conjunta y ejecutar los comandos anteriores. La compilación de Nest y las pruebas de integración deben ejecutarse secuencialmente, pues comparten `dist`.
2. Confirmar las migraciones ya aplicadas en la BD del grupo. Revisar 007 y 008; si existe el antiguo `008_local_mockups.sql`, reconciliar objetos y registro de migraciones antes de ejecutar SQL. No reaplicar a ciegas ni ejecutar la propuesta 009.
3. Coordinar con Persona 4 el contrato único de documentos. No fusionar el módulo antiguo de `documentos` encima de este: usa otro flujo de carga y contiene además trabajo de Albergue.
4. Revisar por separado el trabajo clínico de la rama Medicina; su limpieza de caché no certifica ese módulo. La simulación de fusión de esa rama con el main actual detecta conflictos en `package.json`, `src/main.ts` y `src/common/pipes/parse-bigint-id.pipe.ts`. Su responsable debe reconciliar esa integración; no se presenta Medicina como lista para fusionar. La propuesta conjunta de Persona 3 sí contiene el main revisado como ancestro.
5. Fusionar solo tras la revisión del equipo. No está habilitada la fusión automática.

## Límites que siguen pendientes

- Autenticación y autorización productivas, sesión con área/capacidades reales y almacenamiento privado definitivo. El backend actual usa identidad de pruebas y se restringe al entorno local de desarrollo/pruebas; no es una entrega desplegable a producción.
- Integración con los componentes y router del frontend común cuando el equipo publique su base, y catálogos reales para selectores de profesionales/áreas.
- Pantalla de documentos de Persona 4, reportes y otras pantallas de compañeros no se duplican en esta entrega.
- Riesgos estructurados y cierre/reapertura Social requieren definición del grupo; no se inventa información para completar los mockups.

## Documentación de apoyo

- [Informe técnico y contrato documental](INFORME_INTEGRACION_DOCUMENTOS_PERSONA3.md)
- [Pruebas y alcance](PRUEBAS_20261104.md)
- [Ajuste a los mockups](AJUSTE_VISUAL_MOCKUPS_20261104.md)
- [Índice de vistas React](VISTAS_REACT_PERSONA3.md)
- [Preguntas para el equipo, con ejemplos](DUDAS_EQUIPO_FRONTEND.md)

Los enlaces de vistas locales requieren iniciar React y la API; los datos sintéticos locales no se publican como datos reales de la institución.
