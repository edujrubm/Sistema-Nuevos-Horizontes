# Pruebas y operación

## Estrategia de pruebas

- **Unidad:** políticas de dominio, estados, cálculo de capacidades y edad para fecha de referencia.
- **Integración:** repositorios, migraciones, restricciones, transacciones, bloqueos e índices contra PostgreSQL real.
- **API/e2e:** autenticación, autorización, DTO, errores, idempotencia y flujos completos.
- **Contrato:** OpenAPI compatible con el cliente y ejemplos sanitizados.
- **Seguridad:** matriz de acceso, escalación horizontal/vertical, cargas, sesión, recuperación y exportación.
- **Rendimiento:** búsquedas, expediente completo, concurrencia de Albergue, reportes y exportaciones con volumen representativo.

Casos esenciales:

1. Dos ingresos simultáneos de la misma persona: solo uno confirma.
2. Dos ediciones con la misma versión: una recibe conflicto.
3. Retorno sin salida abierta y segunda salida abierta: rechazados.
4. Otro ámbito intenta consultar/modificar: denegado sin filtrar existencia.
5. Dirección intenta editar o descargar sin capacidad: denegado.
6. Documento anulado conserva versiones y no se entrega por flujo ordinario.
7. Edición evolutiva conserva revisión; entrada sin acción falla.
8. Reintento idempotente no duplica ficha, movimiento ni entrada.
9. Nacimiento en estancia activa crea todos los vínculos o ninguno.
10. Exportación de coordinación no incluye otra área.

## CI

Formato, lint, TypeScript estricto, pruebas, migración desde cero, migración sobre snapshot sanitizado, validación OpenAPI, análisis de dependencias y build. No desplegar si una migración o prueba de autorización falla.

## Observabilidad

- Logs JSON con `requestId`, ruta normalizada, estado, duración y códigos técnicos; sin payload sensible.
- Métricas: latencia/error por operación, pool PostgreSQL, trabajos, almacenamiento, correo y antivirus. No usar persona/CUI como etiqueta.
- Trazas con propagación de contexto y atributos minimizados.
- Alertas sobre errores sostenidos, pool agotado, cola retrasada, fallos de respaldo y espacio.

## Salud

- `/health/live`: proceso responde.
- `/health/ready`: dependencias indispensables disponibles con tiempos acotados.
- Diagnóstico detallado solo para operación autenticada.

## Despliegue

Ambientes separados, infraestructura reproducible, migración controlada antes de activar código incompatible y plan de reversión. Ejecutar procesos con usuario sin privilegios. Limitar CPU/memoria y ajustar pool al número de réplicas y conexiones PostgreSQL.

## Respaldo y recuperación

Respaldar base y objetos; cifrar; conservar según política; probar restauración y consistencia de referencias. Documentar RPO/RTO, responsables y evidencia de simulacros. Antes de cambios destructivos, verificar respaldo restaurable.
