> Actualización del 29 de octubre: este documento es histórico. Consulta [las decisiones vigentes](DECISIONES_VIGENTES.md). Las preguntas ya respondidas no deben reabrirse.

# Persona 3: preguntas explicadas para responder o enviar al grupo

> Varias preguntas ya fueron respondidas. Consulta primero [las decisiones vigentes](DECISIONES_2026-10-27.md) y [la lista de mínimos de borrador](DATOS_OBLIGATORIOS_BORRADOR.md).

Fecha: 26 de octubre de 2026.
Fuente del reparto: Nuevos_Horizontes_Ciclo_2_APIs_Kanban.pdf, páginas 1, 4, 6, 7 y 9.

Puedes responder con el número y tus palabras, por ejemplo: «5: sí se puede corregir después de confirmar». Si una parte no la sabes, escribe «eso lo consulto al grupo». No necesitas responder con términos técnicos.

Los ejemplos ilustran opciones; no son reglas aprobadas. «Actualmente» describe nuestra implementación local de prueba, no necesariamente lo acordado por el equipo. Puedes responder solo una parte de cada pregunta.

## 1. ¿Qué direcciones usaremos para pedir información al sistema?

**En palabras simples:** todos debemos usar las mismas direcciones para que las pantallas encuentren el backend. Una ruta es la dirección de una operación, como consultar las fichas legales de una beneficiaria.

**Ejemplo:** nuestra propuesta usa `/api/v1/legal/beneficiarias/100/fichas`. El código inicial del grupo empezaba con `/api`, sin `/v1`. Si una pantalla usa una y el backend espera otra, la petición falla. También debemos saber si conservamos una ruta propia de Social o consultamos una ruta general indicando «área Social».

**Qué necesitamos decidir:** si usamos las 14 rutas del PDF con `/api/v1`, y si mantenemos las consultas específicas de cada área.

**Puedes responder:** «Usemos las 14 del PDF con /api/v1» o «El grupo ya acordó otras; se las pido».

**Quién puede confirmar:** el grupo, especialmente quien integra las rutas y quien hace las pantallas.

## 2. ¿Qué número identifica una referencia legal?

**En palabras simples:** cada referencia necesita un número interno para encontrarla. Debemos acordar si usa el número de su formulario o un número adicional. Este número no es el CUI ni el número de juicio.

**Ejemplo:** si la referencia pertenece al formulario 25, actualmente la consultamos con `/legal/referencias/25`. En la base recibida, el detalle de referencia está identificado por ese mismo formulario. En las respuestas enviamos `"id": "25"`, como texto, para evitar errores con números muy grandes.

**Qué necesitamos decidir:** confirmar ese identificador compartido y mantener los IDs como texto en todos los módulos.

**Puedes responder:** «Que use el número del formulario y lo mande como texto». Si no conoces el diseño de la base, esta pregunta puede ir al grupo.

**Quién puede confirmar:** persona 2 y quien mantiene la base de datos.

## 3. ¿Cómo organizamos las respuestas y los mensajes de error?

**En palabras simples:** conviene que todos devuelvan la información con el mismo formato. También debemos dividir las listas largas en páginas para no cargar todo de golpe.

**Ejemplo de una lista:**

```json
{
  "datos": [{ "id": "25", "fechaAtencion": "2026-10-26T10:00:00-06:00" }],
  "pagina": 1,
  "limite": 20
}
```

Esto significa «primera página, hasta 20 resultados». Si agregamos `"total": 85`, la pantalla puede mostrar «85 resultados». `fechaAtencion` es una forma de escribir nombres compuestos sin espacios; el equipo debe usar la misma en todos los módulos.

**Qué necesitamos decidir:** nombres de campos, si las listas incluyen el total y cómo se presentan los errores. Por ejemplo, si una edición quedó desactualizada, devolver un código como `VERSION_CONFLICT` y un mensaje entendible.

**Puedes responder:** «Mantengamos ese formato, con total de resultados». El formato técnico de errores puede confirmarlo el grupo.

**Quién puede confirmar:** equipo de backend y quien conecta las pantallas.

## 4. ¿Cómo nos conectamos con el trabajo de la persona 2?

**En palabras simples:** la persona 2 hace la parte común de los formularios: a quién pertenecen, área, fecha, profesional y estado. Nosotros hacemos los campos propios de Social, Legal y Guardería. Debemos guardar ambas partes juntas.

**Ejemplo:** al guardar una ficha social, no debe quedar guardada solo la fecha y la beneficiaria si falla el guardado del diagnóstico social. Se guarda todo o no se guarda nada. Esto es lo que significa una «transacción».

**Qué necesitamos decidir:** cómo llamará el código de la persona 2 a nuestro código para guardar los detalles. Ya preparamos un servicio que permite compartir esa misma operación. La creación local de referencias también debe unificarse con su motor para evitar dos implementaciones distintas de la parte común.

**Puedes responder:** «Usaremos el motor de persona 2 y nuestros detalles se guardan en la misma operación». El acuerdo concreto de funciones lo debe cerrar la persona 2 con nosotros.

**Quién puede confirmar:** persona 2. Es una pregunta principalmente técnica.

## 5. ¿Qué significa borrador y qué pasa después de confirmar?

**En palabras simples:** un borrador es una ficha que todavía se está llenando. Confirmar indica que terminó esa etapa. Falta definir qué cambios se permiten después.

**Ejemplo:** una trabajadora guarda una referencia incompleta como borrador. Después la completa y confirma. Al día siguiente descubre que escribió mal la institución de destino: ¿puede corregirla dejando historial, debe volverla a borrador o necesita una autorización?

**Qué necesitamos decidir:** los nombres definitivos de los estados y si se puede corregir una ficha confirmada o devolverla a borrador. Actualmente usamos estados inventados solo para las pruebas; no son nombres institucionales aprobados.

**Puedes responder:** «Después de confirmar se puede corregir, pero siempre con motivo e historial» o describir el procedimiento real.

**Quién puede confirmar:** tú si conoces el acuerdo institucional; luego el grupo unifica su implementación.

## 6. ¿Qué datos deben estar llenos antes de confirmar?

**En palabras simples:** guardar un borrador puede permitir campos vacíos. Para confirmar debemos saber cuáles son indispensables en cada formulario.

**Ejemplo:** ¿una referencia legal puede confirmarse sin destino? ¿Debe tener siempre motivo y recomendaciones? En Social, ¿el diagnóstico y el plan son obligatorios? En Guardería, ¿qué datos nunca pueden faltar?

**Qué necesitamos decidir:** una lista de campos obligatorios al confirmar para ficha social, ficha legal, referencia legal y ficha de Guardería. No basta con que un campo aparezca en la pantalla: aparecer no significa necesariamente ser obligatorio.

**Puedes responder:** «Referencia: destino y motivo obligatorios; recomendaciones opcionales». Puedes contestar por formulario y dejar los demás pendientes.

**Quién puede confirmar:** requisitos firmados y responsables de cada área, mediante el grupo.

## 7. ¿Cuál es la base de datos oficial que vamos a compartir?

**En palabras simples:** todos deben trabajar con las mismas tablas y columnas. Si cada persona aplica archivos distintos, el código puede funcionar en su computadora y fallar al integrarse.

**Ejemplo:** nuestro trabajo actual funciona con los SQL 01 y 02 recibidos. El prototipo anterior tenía archivos adicionales 03 y 04 con ajustes. Si un compañero no tiene esos ajustes, no podemos dar por hecho que sus columnas existen.

**Qué necesitamos decidir:** cuáles archivos y versiones son los oficiales, qué ajustes adicionales se aprueban y quién reúne los cambios compartidos. No propongo borrar ni volver a ejecutar archivos sobre una base ya instalada.

**Puedes responder:** «La versión oficial es 01+02; los cambios adicionales deben revisarse» o compartir los archivos que el grupo considere definitivos.

**Quién puede confirmar:** quien administra el diseño de la BD y la integración.

## 8. ¿Cuándo se puede agregar un seguimiento?

**En palabras simples:** debemos saber si primero hay que terminar y confirmar la ficha del área, o si se permite anotar atenciones mientras todavía es borrador.

**Ejemplo:** una abogada ya atendió a una beneficiaria, pero aún no termina la ficha legal. ¿Puede registrar «orientación brindada» en la hoja evolutiva ese mismo día? Actualmente el laboratorio exige una ficha confirmada.

**Qué necesitamos decidir:** si el seguimiento requiere ficha confirmada y si siempre debe estar relacionado con una ficha. La base actual exige esa relación; permitir seguimientos sin ficha necesitaría revisar el modelo con el grupo.

**Puedes responder:** «Se puede registrar seguimiento desde el borrador, pero siempre asociado a una ficha» o «Solo después de confirmar».

**Quién puede confirmar:** tú si conoces el flujo de atención y el grupo para la parte de BD.

## 9. ¿La hoja de la beneficiaria muestra también las atenciones de sus hijos?

**En palabras simples:** el expediente reúne a la beneficiaria y sus hijos, pero debemos decidir cómo se muestra el seguimiento de cada persona para no confundir sus atenciones.

**Ejemplo:** la madre recibe asesoría legal y su hijo atención de Guardería. Al abrir la hoja de la madre, ¿aparecen ambas atenciones identificando a quién corresponde cada una, o solo las de ella y se abre aparte la hoja del hijo?

**Qué necesitamos decidir:** qué aparece por defecto y qué filtros necesita la consulta: persona, área, ficha y fechas. Actualmente se consulta todo el expediente y se puede filtrar por hijo, formulario y nombre de área.

**Puedes responder:** «Mostrar separados a madre e hijos, con filtros por área y año». La decisión técnica de filtrar por nombre o número de área puede dejarse al grupo.

**Quién puede confirmar:** tú y quienes diseñan las vistas y el flujo de atención.

## 10. ¿Qué acciones se pueden registrar y qué se puede corregir?

**En palabras simples:** cada seguimiento indica qué se hizo. Falta acordar si la persona escribe la acción libremente o la elige de una lista. También qué datos puede corregir si se equivoca.

**Ejemplo:** podría escribir «Acompañamiento a audiencia» o elegirlo de una lista con «Orientación», «Referencia» y otras acciones aprobadas. Si puso una fecha de atención equivocada, ¿puede cambiarla indicando el motivo?

**Qué necesitamos decidir:** texto libre o lista aprobada; y si se pueden corregir acción, fecha de atención y profesional. La fecha de captura es el momento en que el sistema guardó la nota y debe conservarse junto con quien la capturó.

**Puedes responder:** «Acción de texto libre; se pueden corregir acción, atención y profesional con motivo e historial, conservando la captura».

**Quién puede confirmar:** responsables de área y grupo. Las acciones del ejemplo no son un catálogo ya aprobado.

## 11. ¿Qué debe mostrar el resumen de Trabajo Social?

**En palabras simples:** existe una ruta para un resumen, pero falta definir qué información necesita ver la persona que entra a esa pantalla.

**Ejemplo:** hoy el resumen local muestra el expediente, cuántas fichas sociales tiene y cuándo fue la última atención. ¿También debe mostrar la última actividad, el plan de seguimiento o alguna otra información concreta?

**Qué necesitamos decidir:** la lista exacta de datos del resumen, tomando como referencia la vista aprobada. No añadiremos diagnósticos resumidos ni indicadores por suposición.

**Puedes responder:** «Solo número de expediente, última atención y último seguimiento» o describir la pantalla esperada.

**Quién puede confirmar:** tú, la persona responsable de Trabajo Social y quien hace esa vista.

## 12. ¿Qué niños puede consultar Guardería?

**En palabras simples:** que un niño pertenezca al expediente no necesariamente significa que esté inscrito o asignado a Guardería.

**Ejemplo:** una beneficiaria tiene tres hijos, pero solo uno asiste a Guardería. ¿El personal ve los tres para seleccionar cuál ingresará, o únicamente al niño que ya está inscrito?

**Qué necesitamos decidir:** si consulta todos los hijos o solo los asignados. Si se limita por asignación, necesitamos saber dónde se registra esa inscripción o autorización. Actualmente el laboratorio consulta los hijos existentes del expediente; todavía no aplica permisos definitivos.

**Puedes responder:** «Puede ver a todos para seleccionar, pero solo abrir fichas de los inscritos» o «Únicamente los asignados a Guardería».

**Quién puede confirmar:** tú si conoces el procedimiento, responsables de Guardería y quien implementará permisos.

## 13. ¿Agregamos a la BD los campos de Legal que aparecen en el mockup?

**En palabras simples:** algunas casillas del diseño visual no tienen una columna propia en el SQL 02 original. Hay que decidir si realmente forman parte del alcance aprobado antes de agregarlas.

**Ejemplo:** el diseño incluye relación entre las partes, normativa aplicable, objetivo, actuaciones, acuerdos y observaciones. Si deben llenarse por separado, la base necesita una forma aprobada de guardarlos; no debemos mezclar todo en otro campo solo para que quepa.

**Qué necesitamos decidir:** cuáles campos se mantienen, si se aprueba agregar columnas mediante un nuevo archivo de cambio de BD, o si se ajusta el diseño a los campos ya existentes.

**Puedes responder:** «Sí, esos campos están en el formulario aprobado y deben guardarse separados» o «El alcance aprobado solo incluye los campos actuales».

**Quién puede confirmar:** requisitos y mockups firmados, contigo y el grupo.

## 14. ¿Qué se muestra en el historial de una corrección y quién lo verá?

**En palabras simples:** el historial permite saber qué se cambió, quién lo cambió, cuándo y por qué. Falta decidir cuánto detalle mostramos y a qué personas se les permitirá verlo cuando integremos permisos.

**Ejemplo:** antes decía «Orientación», después «Acompañamiento». La pantalla podría mostrar solo ese cambio y el motivo, en lugar de todo el registro técnico. También hay que decidir si aparece desde la creación de la nota o únicamente desde la primera corrección.

**Qué necesitamos decidir:** incluir o no el registro inicial; mostrar solo campos modificados o todos los valores anteriores/nuevos; y qué roles/áreas podrán consultar ese historial. Actualmente la API local devuelve registros técnicos completos de antes y después.

**Puedes responder:** «Mostrar creación y correcciones, con los campos que cambiaron, autor, fecha y motivo; lo consulta coordinación de su área». Los permisos definitivos se implementan en el ciclo correspondiente.

**Quién puede confirmar:** tú según lo pactado y el grupo que implementará permisos y vistas.

## 15. ¿Cómo vinculamos los PDF con nuestras fichas?

**En palabras simples:** la persona 4 hace la carga y las versiones de documentos. Nosotros necesitamos indicarle a qué ficha pertenece cada PDF y saber qué respuesta recibiremos para mostrarlo.

**Ejemplo:** se sube un PDF correspondiente a la ficha legal 25. Debe quedar asociado a esa ficha y a su expediente, para que no aparezca en otra beneficiaria. Después nuestra vista necesita el identificador, el nombre y el estado del documento para solicitar su consulta mediante el módulo correspondiente.

**Qué necesitamos decidir:** qué datos enviamos al módulo de documentos y qué devuelve. Se mantiene lo ya acordado: solo PDF, sin cámara ni conversión de fotos. No vamos a programar otro sistema de carga en Legal.

**Puedes responder:** «Los PDF se asocian a la ficha correspondiente; el detalle de la conexión lo coordinamos con persona 4».

**Quién puede confirmar:** persona 4; tú puedes confirmar el uso funcional del adjunto.

## 16. ¿Este ciclo entrega solo las APIs o también las pantallas?

**En palabras simples:** una API guarda y entrega información; una pantalla es lo que ve y utiliza el personal. Hay documentos que mencionan React y el código compartido también prepara Handlebars, otra forma de crear pantallas. Hay que saber cuál decisión sigue vigente.

**Ejemplo:** las 14 rutas se pueden probar en Postman aunque aún no exista la pantalla de Guardería. ¿Con eso terminamos nuestra tarjeta de este ciclo, o también debemos entregar esa pantalla funcionando?

**Qué necesitamos decidir:** si el ciclo incluye vistas; si se harán con React o Handlebars; y quién desarrolla las pantallas de nuestras áreas. No hace falta volver a elegir tecnología si el grupo ya lo decidió: basta confirmar la decisión vigente.

**Puedes responder:** «Este ciclo solo APIs; las pantallas van después» o «También hacemos pantallas con la tecnología ya acordada: ...».

**Quién puede confirmar:** todo el grupo.

## 17. ¿En qué ramas entregamos los cambios y quién los revisa?

**En palabras simples:** las ramas separan el trabajo antes de unirlo al proyecto principal. Como ahora nos corresponden varias áreas, hay que acordar cómo organizamos la entrega.

**Ejemplo:** podríamos entregar Legal, Social y Guardería en sus respectivas ramas, o trabajar en una rama de persona 3 y dividir después la integración. También necesitamos saber quién revisará las pruebas y aprobará los cambios.

**Qué necesitamos decidir:** ramas de entrega, cómo integrar lo transversal de evolución y quién revisa las cinco tarjetas de nuestra asignación. Actualmente los cambios están en la rama local `persona3/ciclo2-local`, sin subirlos a GitHub.

**Puedes responder:** «Cada área va a su propia rama y evolución a una compartida; nos revisa ...» o enviar esta pregunta al grupo.

**Quién puede confirmar:** equipo completo o responsable de integrar en `main`.

## Plantilla breve para tus respuestas

Copia los números que puedas responder. Puedes poner «grupo» en los demás.

```text
1:
2:
3:
4:
5:
6:
7:
8:
9:
10:
11:
12:
13:
14:
15:
16:
17:
```

## Lo que ya está definido y no necesitamos volver a preguntar

- Nos corresponden Social, Legal y referencias, Guardería y evolución transversal.
- Persona 1 hace beneficiarias, familia, ficha inicial y catálogos; persona 2 hace el motor común; persona 4 hace documentos y Albergue.
- La autenticación se deja para después; las pruebas actuales usan datos ficticios en un entorno local.
- No se borran físicamente registros históricos.
- No se implementan movimientos individuales de niños en este ciclo.
- La impresión de referencias y la descarga controlada están diferidas en la planificación.
- Los adjuntos son exclusivamente PDF; no hay cámara ni conversión de imágenes.

## Actualización del 27 de octubre

Las respuestas ya recibidas están registradas en [decisiones vigentes](DECISIONES_2026-10-27.md). Las explicaciones anteriores se conservan como referencia; no representan preguntas aún abiertas en todos los casos. Los mínimos de borrador se discuten en [esta lista](DATOS_OBLIGATORIOS_BORRADOR.md). Legal lleva solo beneficiarias; inscripción en Guardería equivale a una ficha GUARDERIA confirmada; también se incluye carga PDF.
