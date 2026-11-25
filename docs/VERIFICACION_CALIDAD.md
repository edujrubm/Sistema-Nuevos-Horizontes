# Verificación y calidad

## Ensayo de cuentas de demostración — 2026-11-25

- Base de código: `origin/main` 88ce2a4, rama `usuarios-demo`. No se modifica código de los módulos ni DDL.
- `pnpm check`: aprobado; inventario/hash de 22 migraciones y 4 pruebas de inventario; tipos; 50 pruebas backend, 265 frontend y compilación API/web. Se conservan 3 omisiones existentes del frontend.
- `scripts/test-usuarios-demo.ps1`: PostgreSQL 18 desechable en loopback, esquema/fixtures sintéticos y las 22 migraciones 003–024 aplicadas sin errores; 9 escenarios aprobados tras retirar el generador PDF e incorporar la importación privada de claves. La creación comprueba además que no genera PDF.
- Cobertura nueva: asignación explícita de roles reales; rechazo de ID/código/área incompatibles, actor inexistente, destino incorrecto, carpeta Git y producción; rollback tras una alta parcial, incluidas auditoría y empleados; dos creaciones simultáneas sin duplicados; repetición sin reset; reconciliación de estado pendiente; rechazo de colisiones; CLI sin contraseñas en salida.
- Once cuentas con Argon2id y once altas auditadas; login, perfil, logout y revocación comprobados por HTTP real para las once. En el fixture, sólo administración tiene `crear:usuarios`: la API devuelve 403 a los otros diez perfiles y conserva su validación de datos para administración. No se incorporan estos permisos sintéticos a la aplicación ni a las migraciones.
- Roles, matriz de permisos, usuario/empleado anteriores y formularios se comparan antes/después y permanecen idénticos. No se prueba que toda autorización por área/caso esté completa.
- PDF entregado exclusivamente fuera de Git, generado de forma independiente al inicializador y revisado visualmente con Poppler. Presenta claves preparadas de once cuentas todavía no creadas en la BD compartida. Su JSON privado puede importarse con `--credenciales`; ni el PDF, ni ese JSON, ni un generador PDF forman parte del PR.
- Límite: no hay evidencia de conexión/ejecución en BD compartida. Git acredita los scripts disponibles, no las migraciones efectivamente aplicadas allí. El operador debe cotejar catálogo e historial antes de ejecutar.

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

Las pruebas se ejecutan sólo con PostgreSQL desechable en loopback y datos sintéticos; no sobre la BD compartida. No se acredita sesión productiva ni proveedor final de archivos; D-13 confirma que no se requiere aprobación de PDFs. Los datos y resultados temporales se excluyen de Git.

### Resultado final de ramas independientes

Albergue y Documentos pasaron por separado el check integrado (49 backend, 257 frontend; 3 omisiones explícitas de pruebas con servidor) y 71 pruebas PostgreSQL cada una. La combinación pasó el mismo check y 75 pruebas PostgreSQL, sin omisiones en estas suites. También se completaron los tres flujos reales de edición, confirmación, carga PDF y recuperación de bytes desde React a través de Vite/NestJS/PostgreSQL, sin sustituir respuestas.

El registro del módulo Documentos incluye explícitamente las entidades compartidas de área/formulario que utiliza; no depende de su registro por otra área. Un identificador infantil ausente se rechaza antes de construir la consulta ORM. Los dos órdenes de fusión se comprobaron sin conflictos y con un mismo árbol de código. Se verificó que el diff no modifica rutas/código de otros módulos ni archivos de database/. La base común y los cambios propios se mantienen identificables para el PR.

### Regresión de PDF sin aprobación — 2026-11-18

Se verifica que una carga válida se presenta como VIGENTE aunque su columna histórica de revisión conserve BORRADOR, sin asignar revisado_por/revisado_en. El filtro VIGENTE incluye inmediatamente el archivo, la descarga conserva sus bytes y una anulación lo excluye de vigentes y lo incluye en ANULADO. La UI no ofrece el filtro Borrador ni el contador de pendientes de revisión; el mensaje de carga no sugiere aprobación posterior. Los estados de borrador y confirmación de las fichas de área se conservan.

Resultado: 49 pruebas backend y 258 frontend aprobadas; 3 omisiones explícitas de servidor en la suite ordinaria; tipos y compilación aprobados. La suite PostgreSQL pasó 72 pruebas sin fallos. Los tres flujos reales desde React (Legal, Social y Guardería) comprobaron carga, disponibilidad inmediata y recuperación de bytes, sin indicador de aprobación pendiente.

## Depuración del legado — 2026-11-24

Base: origin/main 520e1a3. PostgreSQL 18 desechable en loopback 55591,
sin conexión a Neon ni ejecución en una base del grupo. Se aplicó el esquema
base y todos los SQL vigentes, incluida 024: 79 pruebas de arquitectura, HTTP,
Postman, PDFs, versiones concurrentes, referencias, evolución y Albergue aprobadas.
Dos escenarios adicionales dentro de esa suite verifican que 024 conserva tanto
revisión completa como ausencia de revisión, conserva catálogo/contenido/versiones
y revierte toda la transacción ante una vista externa dependiente.

Los primeros intentos identificaron desajustes del banco de pruebas tras integrar
autenticación: faltaba JWT_SECRET local, AuthProvider en tres tests de navegación
y la etiqueta vigente Área Trabajo Social. Se corrige sólo el montaje de nuestras
pruebas y el entorno desechable; no se cambia Seguridad ni el layout del equipo.
Las 45 pruebas dirigidas de Legal/Social/Guardería pasan después del ajuste.

Los SQL históricos permanecen intactos. El mapa/renombre del PR 36 es una propuesta
separada; esta depuración no modifica ese PR. main incorporó otra migración 009 de
Seguridad: coordinar su numeración con el responsable, no renombrarla como parte
de esta limpieza. No existe evidencia para borrar tablas experimentales de una
base compartida: se retiró su propuesta sin ejecutar DROP sobre esos ambientes.

Cierre de pruebas: 50 pruebas unitarias de backend y 265 de frontend aprobadas;
3 de frontend permanecen omitidas por el repositorio. Tipos del frontend y
compilaciones de API/web correctos. Las 79 comprobaciones de PostgreSQL/HTTP
finalizaron sin fallos. No se ejecutaron pruebas contra ambientes compartidos.

## Revisión final conjunta — 2026-11-24

Base final f931ee70e13789134b0ecc73ea348747c23c6ad6; entrega depuracion hacia main,
en sustitución del PR 36. Los resultados siguientes sustituyen el estado local
previo de esta misma depuración.

| Verificación | Resultado |
| --- | --- |
| pnpm check | Correcto: inventario, tipos, 50 pruebas API, 265 pruebas web y compilaciones; 3 web omitidas por la suite existente |
| TypeScript API y web con noUnusedLocals y noUnusedParameters | Sin errores |
| Integración con PostgreSQL 18 desechable | 84 aprobadas, cero fallos |
| Legal independiente y React/HTTP real | 31 aprobadas |
| Social independiente y Postman real | 30 aprobadas |
| Guardería independiente y React/HTTP real | 31 aprobadas |
| Paternidad independiente | 9 aprobadas |
| Identificadores de la agrupación retirada | Ausentes de código, herramientas, Postman y SQL vigentes; sólo se conservan identidades históricas en manifest.json |
| Inventario SQL | 22 archivos, secuencia 003–024 única, hashes verificados y orden histórico conservado |

La prueba de actualización reconstruye otra BD desechable desde los scripts
originales recuperados del commit base y verificados por hash. Crea un PDF
histórico sintético con revisión, consulta la API antes y después de 024, y exige
la misma respuesta operativa. Compara todos los registros de todos los módulos y
la auditoría, salvo los tres campos trasladados al archivo histórico. Verifica
su conservación, y compara columnas, restricciones, índices, triggers y funciones
con la instalación nueva. Otro escenario comprueba rollback ante una vista externa
dependiente. No se ejecuta CASCADE en 024 ni se modifica una base compartida.

Los escenarios se ejecutan con la misma configuración de archivo SQL del instalador,
para no confundir diferencias CRLF/LF de stdin con cambios en cuerpos de funciones.
Se mantienen excepciones de formato acotadas en .gitattributes para preservar los
bytes SQL y el formato histórico de los archivos modificados. La lista de hashes
incluye el comentario de cabecera normalizado y su identidad anterior.

Límite: estas pruebas no acreditan el estado de Neon/producción ni protegen
consumidores externos no presentes en el repositorio. El responsable debe cotejar
su historial y respaldar antes de aplicar 024. No se promete disponibilidad
productiva de permisos/almacenamiento pendientes ni se fusiona automáticamente.
