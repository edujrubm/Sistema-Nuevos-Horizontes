# Pruebas de persona 3 - 29 de octubre de 2026

## Resultado vigente

- Compilación NestJS/TypeScript correcta.
- **26 pruebas de integración correctas, 0 fallidas**, contra PostgreSQL 18 aislado.
- Las 14 rutas P3 coinciden exactamente con la página 4 del PDF; prueba automática de contrato.
- Newman en esta ejecución: **14 peticiones y 21 aserciones, sin fallos**; incluye comprobación de las listas con total. La carga PDF se volvió a verificar en las pruebas HTTP/BD; su colección separada había pasado previamente.
- Solo SQL 01 y 02 recibidos. Sin aplicar parches anteriores ni migraciones nuevas.

## Cobertura

Consultas Social/Legal/Guardería; validación de IDs/paginación/campos desconocidos; alta atómica y rollback de referencia; edición, confirmación y corrección posterior con motivo e historial; evolución solo en fichas confirmadas y área propia; diez altas simultáneas y dos correcciones concurrentes (una correcta, un conflicto); historial con creación/cambios, autor/fecha/motivo y filtro de coordinación del área; Guardería lista todos los hijos y abre solo inscritos; resumen Social basado en campos existentes del mockup.

PDF: original conservado byte por byte, SHA-256, asociación a ficha/expediente/área y auditoría. Rechaza imágenes, PDF falso, más de 20 MiB, expediente incorrecto y otra área. Sin rutas genéricas de persona 2 ni dependencia de su implementación.

## Pantalla y persistencia

Prueba de navegador sobre http://127.0.0.1:3003/laboratorio/persona3.html: consulta Social e hijos, creación de referencia 6, confirmación y corrección posterior manteniendo estado confirmado (versión 5), alta de seguimiento Legal, consulta de historial y carga PDF asociada a ficha 2/expediente 1 (876 bytes, checksum real). Tras reiniciar el servidor, el historial siguió disponible. Evidencia: pantalla-verificada.png.

Es una pantalla de laboratorio con datos sintéticos, no el frontend final. Las brechas del mockup Social están en REVISION_VISTAS.md.

## Reproducir

```powershell
pnpm install --frozen-lockfile
pnpm test:persona3
pnpm start:persona3
pnpm exec newman run postman/CargaPDF.postman_collection.json --working-dir postman
```

Evidencias detalladas ignoradas por Git: test-results/persona3.tap, newman.json y newman-pdf.json. El ensayo detiene su cluster desechable. La demo persistente usa otro cluster y otro log para poder correr ambas verificaciones a la vez.

## Límites

P3_TEST_AREA y P3_TEST_ROLE simulan contexto del servidor; no acreditan autenticación institucional. ID de referencia y JSON paginado ya están ratificados. La referencia exige destino y motivo al confirmar; ambos se conservan obligatorios tras corregirla. La entrega funciona por sí misma sin depender de código o almacenamiento de compañeros. No hubo push. La guía general de errores todavía debe normalizarse en el código y no se declara implementada por esta prueba. No se modificó la BD compartida.


## Pruebas añadidas el 29 de octubre

- Totales de las siete consultas paginadas: cuentan todo el filtro, no el tamaño de la página. Una página fuera de rango devuelve lista vacía con total correcto. Filtro de hijo mantiene separación por área.
- Borrador de referencia con solo fecha y profesional en cuerpo y beneficiaria en ruta: detalle vacío creado automáticamente.
- Rechazo de confirmación incompleta sin cambios de estado, versión ni número de revisiones.
- Confirmación con destino y motivo reales, incluyendo rechazo de espacios; origen/recomendaciones pueden quedar null.
- Corrección parcial de confirmada: conserva campos no enviados, estado y completitud; rechaza borrar obligatorios y no pierde versión.

## Contratos actualizados

OpenAPI y Postman reflejan `{datos,pagina,limite,total}`, ID de formulario para referencia, mínimo de borrador y validación de datos guardados al confirmar. La única duda funcional pendiente es la correspondencia de campos Social ausentes del SQL.
