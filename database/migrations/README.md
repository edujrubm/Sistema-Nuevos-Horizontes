# Migraciones SQL

La API no aplica scripts al arrancar: synchronize y migrationsRun permanecen
desactivados. El esquema base institucional aprobado se prepara por separado;
las migraciones incrementales de este directorio van de 003 a 024.

## Inventario y cambios de nombre

La normalización autorizada por Eduardo el 24 de noviembre de 2026 conserva el
orden lexicográfico histórico completo y elimina sus colisiones numéricas.
Los 21 SQL históricos conservan su contenido ejecutable. En el archivo de campos
complementarios se corrigió exclusivamente el comentario de cabecera que nombraba
la antigua distribución personal; no se cambia ninguna sentencia de ese script.
El resto de SQL históricos permanece byte por byte igual a la versión base.
Los futuros cambios de esquema requieren un SQL nuevo: no reescribir uno aplicado.

manifest.json registra nombres actuales, anteriores y SHA-256 exactos. Incluye
los nombres propuestos en el PR 36, sustituido por esta entrega. Los nombres
anteriores sólo documentan procedencia; no son módulos ni scripts adicionales.
Los comentarios numéricos internos de otros SQL históricos conservan su texto
original; el orden operativo vigente es el del manifiesto y los nombres actuales.

| Archivo vigente | Procedencia |
| --- | --- |
| `003_persona1_soporte_operativo.sql` | Sin nombre anterior distinto |
| `004_ninos_estado_operativo.sql` | Sin nombre anterior distinto |
| `005_ficha_inicial_borrador_unico.sql` | Sin nombre anterior distinto |
| `006_nino_cui_unico.sql` | Sin nombre anterior distinto |
| `007_estado_formulario_descartado.sql` | Sin nombre anterior distinto |
| `008_formularios_campos_complementarios.sql` | Consultar equivalencias en el manifiesto |
| `009_documentos_integracion.sql` | Consultar equivalencias en el manifiesto |
| `010_sesiones_usuario.sql` | Consultar equivalencias en el manifiesto |
| `011_albergue_trazabilidad.sql` | Consultar equivalencias en el manifiesto |
| `012_habilitar_usuarios.sql` | Consultar equivalencias en el manifiesto |
| `013_usuario_estado_operativo.sql` | Consultar equivalencias en el manifiesto |
| `014_auditoria_estado_usuarios.sql` | Consultar equivalencias en el manifiesto |
| `015_guarderia_responsables.sql` | Consultar equivalencias en el manifiesto |
| `016_padre_nino.sql` | Consultar equivalencias en el manifiesto |
| `017_usuario_empleado_unico.sql` | Consultar equivalencias en el manifiesto |
| `018_albergue_estado_inactivo.sql` | Consultar equivalencias en el manifiesto |
| `019_auditoria_creacion_usuarios.sql` | Consultar equivalencias en el manifiesto |
| `020_restringir_restablecimiento_usuarios.sql` | Consultar equivalencias en el manifiesto |
| `021_cambio_contrasena_obligatorio.sql` | Consultar equivalencias en el manifiesto |
| `022_ficha_inicial_descarte_logico.sql` | Consultar equivalencias en el manifiesto |
| `023_catalogo_geografico_guatemala.sql` | Consultar equivalencias en el manifiesto |
| `024_retirar_revision_documental.sql` | Sin nombre anterior distinto |

## Verificación sin ejecutar SQL

Ejecutar desde la raíz:

```sh
node scripts/verificar-migraciones.cjs
node scripts/verificar-migraciones.cjs --aplicadas registro-del-ambiente.json
```

El primer comando valida archivos, hashes y secuencia; no certifica la BD.
El segundo compara un registro aportado por el encargado, con este formato:

```json
{"aplicadas":[{"archivo":"nombre-completo.sql","sha256":"hash-de-los-bytes-aplicados"}]}
```

Incluir sólo las migraciones incrementales de este directorio (003 en adelante).
Un registro por número solamente no permite resolver colisiones históricas.
El verificador rechaza nombres/hash desconocidos y una misma migración registrada
dos veces con distintos nombres. Reconoce las equivalencias sin recomendar
reaplicar el SQL. No conecta a PostgreSQL ni ejecuta comandos de migración.

## Antes de aplicar en un ambiente compartido

1. Identificar ambiente, respaldo, ventana de intervención y encargado.
2. Cotejar su registro real con el manifiesto y comprobar los objetos existentes.
3. Si un nombre anterior ya se aplicó, NO ejecutar su renombre. No cambiar registros
   operativos automáticamente ni volver a lanzar todo el directorio.
4. Si el historial es incompleto, verificar el esquema con el encargado antes de
   decidir qué falta; la salida del verificador no sustituye esa inspección.
5. Ejecutar únicamente el SQL faltante aprobado y registrar su resultado en
   docs/DECISIONES_Y_DUDAS.md y en el registro real del ambiente.

## Retiro de revisión documental

024 requiere la integración documental vigente (009 en este inventario).
Archiva los valores de las tres columnas retiradas y su catálogo en
archivo_revision_documental, fuera del modelo/API de trabajo. Conserva PDFs,
versiones, autores y auditoría. No reconstruye tablas de otros módulos.
Se ejecuta una sola vez, transaccionalmente y sin CASCADE: una dependencia externa
inesperada provoca rollback. Requiere bloqueo exclusivo de documento_area;
planificar la ventana y conservar el respaldo hasta verificar el resultado.
No usar una supuesta reversión que borre documentos o el archivo histórico.
