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
