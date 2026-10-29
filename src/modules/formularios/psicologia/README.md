# Psicología

Consultas de identificación y fichas psicológicas de beneficiarias, niñas y niños.

## Rutas

Todas las rutas usan el prefijo global `/api/v1`:

- `GET /psicologia/beneficiarias/:id/resumen`
- `GET /psicologia/beneficiarias/:id/fichas`
- `GET /psicologia/hijos/:id/resumen`
- `GET /psicologia/hijos/:id/fichas`

Los resúmenes entregan solamente identificación del sujeto. Las rutas `fichas` devuelven la
cabecera, datos generales de la atención, familiares declarados, el detalle clínico completo y
el examen mental de cada formulario. El listado usa `limit` (1 a 100, predeterminado 20) y
`cursor` como parámetros opcionales.

La autenticación y autorización se conectarán en una etapa posterior. Hasta entonces estas
rutas no deben exponerse fuera de un ambiente de desarrollo controlado porque contienen
información clínica sensible.
