# Formularios

El motor compartido expone la cabecera `formulario_area` y los detalles tipados
de Psicología, Medicina, Trabajo Social, Legal y Guardería.

## Rutas compartidas

- `GET /api/v1/beneficiarias/:id/formularios-area`: lista paginada; acepta
  `areaId`, `tipo`, `cursor` y `limite`.
- `POST /api/v1/beneficiarias/:id/formularios-area`: crea cabecera y detalle en
  una transacción.
- `GET /api/v1/formularios-area/:id`: consulta cabecera, detalle y examen mental.
- `PATCH /api/v1/formularios-area/:id`: actualiza únicamente un borrador y
  exige `version` y `motivo`.
- `POST /api/v1/formularios-area/:id/confirmar`: cambia el estado con control de
  versión.
- `POST /api/v1/formularios-area/:id/descartar`: descarta lógicamente un
  borrador; exige `version` y `motivo`.
- `GET /api/v1/tipos-formulario`: publica variantes, área, sujeto requerido y
  campos admitidos.

Los códigos de estado se leen de `FORM_DRAFT_STATE_CODE`,
`FORM_CONFIRMED_STATE_CODE` y `FORM_DISCARDED_STATE_CODE` (`BORRADOR`,
`CONFIRMADO` y `DESCARTADO` por defecto). La API no
inventa filas en `estado_formulario`: si el catálogo aprobado aún no contiene
esos códigos, las mutaciones responden
`FORM_STATE_CATALOG_NOT_CONFIGURED`.
