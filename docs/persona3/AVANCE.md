# Avance vigente de persona 3

Actualizado el 29 de octubre de 2026. Copia de trabajo: `Sistema-Nuevos-Horizontes-Persona3`. Rama de preparación local: `persona3/ciclo2-local`. Sin push. Las decisiones del usuario están en DECISIONES_VIGENTES.md.

## APIs implementadas

- Las **14 rutas de persona 3** coinciden exactamente con la página 4 del PDF; una prueba las compara contra el texto extraído del documento.
- Carga PDF adicional autorizada por el usuario: **POST /api/v1/beneficiarias/:id/documentos/cargas**, tomada de la página 5 del mismo PDF. Carga autónoma de nuestra entrega, sin dependencia de servicios de compañeros. No reemplaza las 14 rutas P3.
- Consultas Social, Legal y Guardería; alta/consulta/corrección/confirmación de referencias; evolución y revisiones transversales.
- Referencias confirmadas editables con versión actual y motivo; conservación del estado e historial anterior/nuevo en BD.
- Hoja evolutiva limitada al área activa, con filtros existentes. Solo se agrega atención a fichas confirmadas. Acción libre y correcciones auditadas.
- Historial de creación y cambios presentado por campo, con autor, fecha y motivo; solo coordinación del área activa en el contexto local.
- Legal corresponde únicamente a beneficiarias. No se admiten procesos legales infantiles ni se amplió el SQL para eso.
- Guardería permite seleccionar todos los hijos; solo abre fichas de niños con una ficha GUARDERIA confirmada.
- No se invocan servicios ni endpoints P2. No se duplican sus 6 rutas genéricas. El soporte de integración P2 propuesto anteriormente fue retirado del código activo.
- Sin migraciones nuevas: se usa la base 01 + 02 recibida. Estados de laboratorio sintéticos y explícitos.

## PDF

Multipart: `archivo`, `formularioId`, `categoria`. Máximo 20 MiB. Se comprueba extensión, MIME y contenido PDF legible/no cifrado; se conserva el archivo original y su SHA-256. Se vincula a ficha, expediente y área, y se rechazan cruces de beneficiaria/área. No se expone el directorio privado en la respuesta. Si falla la operación de BD se retira el archivo creado por esa carga.

El almacenamiento es privado **local** de laboratorio. No se requiere almacenamiento compartido para nuestro funcionamiento. Versiones/descarga fuera de las rutas asignadas no se añaden por esta decisión. El SQL actual no incluye nombre original de documento: no se simula su persistencia.

## Ejecutar

```powershell
pnpm install --frozen-lockfile
pnpm test:persona3
pnpm start:persona3
```

Requiere PostgreSQL 18 (`C:\Program Files\PostgreSQL\18\bin`, ajustable con `-PostgresBin`). Pruebas: cluster desechable en puerto 55437. Demo persistente: PostgreSQL 55438, API 3003. Ambas instancias son locales con datos ficticios. El script de prueba detiene su PostgreSQL al finalizar.

Pantalla de comprobación: http://127.0.0.1:3003/laboratorio/persona3.html . No sustituye las vistas aprobadas: permite verificar Social, hijos de Guardería, referencias, seguimiento, historial y adjuntos contra la API real.

`P3_TEST_AREA=Legal` y `P3_TEST_ROLE=COORDINACION` simulan el contexto de la sesión futura en el servidor. El navegador no puede elegir otro ámbito para acceder a evolución. Estos valores **no son autenticación definitiva** y solo se aceptan en desarrollo/pruebas. No publicar este laboratorio en Internet.

## Acuerdos vigentes y pendiente funcional

- Referencias identificadas por formulario_area.id como texto.
- Listas con datos/pagina/limite/total; totales sin límite de página y con los mismos filtros.
- Borradores con datos mínimos técnicos; contenido opcional. Referencia: fecha/profesional en cuerpo y beneficiaria en ruta; detalle vacío automático.
- Confirmación con destino y motivo de referencia obligatorios. Corrección de confirmadas con motivo/historial, conservando los obligatorios.
- Sin dependencia de otros compañeros para código o almacenamiento.
- Pendiente funcional: campos del mockup Social que no existen en SQL.
- La guía de errores está documentada; su normalización general en el código es una tarea técnica distinta y no se declara completada por estos acuerdos.

## Entregables

- `postman/Persona3.postman_collection.json`: las 14 peticiones.
- `postman/CargaPDF.postman_collection.json`: carga añadida, con `postman/fixtures/documento.pdf`.
- `docs/persona3/openapi.json`: las 15 operaciones documentadas, incluidos límites pendientes.
- `docs/persona3/DATOS_OBLIGATORIOS_BORRADOR.md`: mínimos ya definidos.
- `docs/persona3/DECISIONES_VIGENTES.md`: respuestas y pendientes actualizados.
- `docs/persona3/PRUEBAS.md`: resultados reproducibles.

## Revisión para encargado de BD

[REVISION_BD_MOCKUPS_PERSONA3.md](REVISION_BD_MOCKUPS_PERSONA3.md) compara cinco mockups con SQL 01+02, identifica 28 puntos para revisar y propone nombres, tablas y tipos con justificación sencilla. No se ejecutaron migraciones. Las propuestas no amplían las rutas ni cambian lo aprobado por el usuario.
