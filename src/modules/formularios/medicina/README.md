# Medicina

Consultas paginadas de fichas médicas de beneficiarias, niñas y niños.

## Rutas

Todas las rutas usan el prefijo global `/api/v1`:

- `GET /medicina/beneficiarias/:id/fichas`
- `GET /medicina/hijos/:id/fichas`

Ambas admiten `limit` (1 a 100, predeterminado 20) y `cursor` como parámetros opcionales.
La respuesta incluye cabecera, edad calculada a la fecha de atención, datos generales,
familiares declarados y detalle clínico.

La ruta de beneficiarias devuelve las fichas históricas `MEDICINA_ADOLESCENTE` y
`MEDICINA_MUJER` según el tipo registrado en cada atención. La ruta de hijos devuelve
exclusivamente `MEDICINA_NINEZ`. La consulta no reclasifica una ficha histórica usando la edad
actual y cada variante expone únicamente sus campos aplicables.

La autenticación y autorización se conectarán en una etapa posterior. Hasta entonces estas
rutas no deben exponerse fuera de un ambiente de desarrollo controlado porque contienen
información clínica sensible.
