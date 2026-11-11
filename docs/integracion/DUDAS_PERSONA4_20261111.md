# Preguntas de coordinación después de Persona 4

El flujo funcional se prueba en local. Estas preguntas corresponden al uso institucional o a ampliaciones del modelo; no se inventaron respuestas para completar la interfaz.

## 1. Documentos propios de Albergue

La BD vincula cada PDF con un formulario de área. Existen tipos Social, Legal, Guardería, Psicología y Medicina, pero no un formulario específico de Albergue.

Ejemplo: una constancia Legal se adjunta a su ficha Legal. Un documento propio de una estancia no debe asignarse a Legal solo para poder subirlo.

**Para copiar:** «¿Los PDF de Albergue se asociarán a una estancia o tendremos una ficha de área propia? El contrato actual exige formularioId y no debemos usar una ficha de otra área. Definamos esa relación antes de ampliar el esquema.»

## 2. Sesión y permisos reales

Actualmente la API local obtiene actor y área de su configuración de pruebas. No permite que el usuario cambie su área desde el formulario.

Ejemplo: al iniciar sesión como Legal se deben listar solo fichas y documentos Legal autorizados, y solo coordinación puede anular.

**Para copiar:** «¿Cuál será el contrato de sesión para el área, los casos asignados y las capacidades de cargar/anular documentos y operar Albergue? Hay que reemplazar la identidad técnica de pruebas antes de producción.»

## 3. Almacenamiento definitivo

Los PDF se conservan en un directorio privado local y la API controla su descarga e integridad. Ese directorio no se publica en Git.

Ejemplo: si se cambia de computadora o servidor, se deben trasladar de forma coordinada los PDF y sus referencias de BD.

**Para copiar:** «¿Qué almacenamiento privado se usará en producción y quién configurará credenciales, respaldo y recuperación junto con la BD? El flujo actual ya funciona en local; falta conectar el proveedor definitivo sin duplicar rutas.»

## 4. Historial anterior a la migración

La nueva tabla registra los eventos futuros con su autor y hora. Los datos viejos no siempre contienen esos valores.

Ejemplo: una estancia antigua tiene fecha de ingreso, pero no se puede atribuir a una persona ni inventar una hora de captura.

**Para copiar:** «¿Necesitamos migrar eventos históricos de Albergue desde registros físicos o fuentes verificadas? Si es así, acordemos qué datos son comprobables y cómo marcar los valores desconocidos; no asignaremos autores u horas ficticios.»
