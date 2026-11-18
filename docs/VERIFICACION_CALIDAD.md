# Verificación y calidad

Esta es la guía única para QA y evidencia de verificación. No crear reportes de
pruebas por módulo, navegador, entrega o pull request. Registrar el resumen de
una ejecución publicada en `HISTORIAL_DOCUMENTAL.md`.

## Verificación mínima

Ejecutar desde la raíz antes de una integración:

```bash
pnpm install --frozen-lockfile
pnpm run check
```

`pnpm run check` valida tipos, pruebas y compilación del backend y frontend. Si
el cambio toca persistencia, ejecutar además la prueba de integración aplicable
contra PostgreSQL local desechable y datos sintéticos. No dirigir pruebas que
escriben datos a Neon compartido ni producción.

## Qué registrar en el historial

- Comandos ejecutados y resultado real, incluidos fallos o pruebas omitidas.
- Alcance comprobado: contrato, interfaz, migración, transacción o regresión.
- Ambiente: local sintético, PostgreSQL desechable o ambiente autorizado.
- Límites no verificados: por ejemplo, navegador, despliegue, autorización o
  migración pendiente.

No adjuntar secretos, datos personales, URLs privadas, volúmenes de datos ni
logs completos al historial. Los artefactos locales ignorados por Git sirven
para depurar, pero no sustituyen una prueba reproducible versionada.

## Revisión de código

Además de las pruebas, revisar las reglas de tamaño, cohesión, comentarios,
SQL/ORM, autorización y auditoría de `docs/contexto/backend/AGENTS.md`. Un
resultado verde no aprueba por sí solo una decisión de negocio ni un despliegue.

## Revisión de entrega de Albergue y Documentos — 2026-11-18

El ensayo original pasó instalación congelada, check completo (49 pruebas backend y 257 frontend, con 3 omisiones de servidor), 72 pruebas PostgreSQL y flujos reales de guardar/confirmar/subir/recuperar PDF desde React en Legal, Social y Guardería. Las omisiones no se presentan como ejecutadas. La geometría de las fichas de esas tres áreas se revisó localmente, pero sus cambios visuales quedan fuera de esta publicación.

La publicación exige volver a verificar las dos ramas por separado y su integración conjunta. Las pruebas propias son test/albergue-arquitectura.unit.cjs y test/documentos-arquitectura.unit.cjs: ninguna exige la reconstrucción de la otra área. Se conserva el contrato de rutas y se prueba rollback, concurrencia, auditoría, integridad PDF y compatibilidad de los consumidores. La prueba documental adicional rechaza un identificador infantil ausente sin ejecutar una consulta ampliada por TypeORM.

Las pruebas se ejecutan sólo con PostgreSQL desechable en loopback y datos sintéticos; no sobre la BD compartida. No se acredita sesión productiva, aprobación documental ni proveedor final de archivos. Los datos y resultados temporales se excluyen de Git.

### Resultado final de ramas independientes

Albergue y Documentos pasaron por separado el check integrado (49 backend, 257 frontend; 3 omisiones explícitas de pruebas con servidor) y 71 pruebas PostgreSQL cada una. La combinación pasó el mismo check y 75 pruebas PostgreSQL, sin omisiones en estas suites. También se completaron los tres flujos reales de edición, confirmación, carga PDF y recuperación de bytes desde React a través de Vite/NestJS/PostgreSQL, sin sustituir respuestas.

El registro del módulo Documentos incluye explícitamente las entidades compartidas de área/formulario que utiliza; no depende de su registro por otra área. Un identificador infantil ausente se rechaza antes de construir la consulta ORM. Los dos órdenes de fusión se comprobaron sin conflictos y con un mismo árbol de código. Se verificó que el diff no modifica rutas/código de otros módulos ni archivos de database/. La base común y los cambios propios se mantienen identificables para el PR.
