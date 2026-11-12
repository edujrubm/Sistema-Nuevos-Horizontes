# Documentación vigente

Este directorio contiene la documentación operativa del proyecto. La fuente de
verdad del comportamiento implementado es el código versionado; para la base
de datos también lo son las migraciones aplicadas en cada ambiente.

## Lectura recomendada

1. [Guía técnica](GUIA_TECNICA.md): arquitectura, límites técnicos y cómo verificar cambios.
2. [Decisiones y dudas](DECISIONES_Y_DUDAS.md): decisiones confirmadas y asuntos que aún requieren acuerdo.
3. [Contrato de errores API](CONTRATO_ERRORES_API.md): respuesta uniforme de errores del backend.
4. [Flujo de ramas](flujo-de-ramas.md): colaboración con Git.
5. Las guías de [migraciones](../database/migrations/README.md), [Postman](../postman/README.md) y las reglas de cada módulo cuando apliquen.

## Cómo mantenerla

- No crear informes de avance, entregas o integraciones como documentación permanente. Git, pull requests e incidencias conservan ese historial.
- Antes de implementar una decisión de negocio, regístrala o resuélvela en `DECISIONES_Y_DUDAS.md` con el formato indicado allí.
- Un agente de IA no decide una duda pendiente: debe formular la pregunta al equipo responsable y detener sólo el trabajo que dependa de esa respuesta. Las reglas completas están en `../AGENTS.md`.
- Cuando una decisión afecte código, migraciones o contrato, actualiza también el archivo técnico que corresponda en el mismo cambio.
- Una migración aplicada es inmutable. Su existencia en Git no demuestra que esté aplicada en Neon u otro ambiente: registrar esa comprobación en la decisión o despliegue correspondiente.

Los documentos retirados durante la limpieza del 12 de noviembre de 2026 eran propuestas, reportes de integración o contexto duplicado. Permanecen recuperables mediante el historial de Git.
