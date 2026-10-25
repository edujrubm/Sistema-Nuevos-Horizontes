# Trazabilidad inicial del frontend

Esta matriz identifica dónde se reflejan los principales grupos de requisitos y qué datos preliminares aparecen en el diagrama. No declara que estén implementados ni aprobados. Las brechas concretas están en `FRONTEND_DATA_MODEL.md`.

| Requisitos | Módulo principal | Datos del diagrama | Comportamiento del frontend |
|---|---|---|---|
| RF-GU1 a RF-GU12 y correcciones de matriz del 19-10-2026 | Autenticación y Administración | `usuario`, `empleado`, `rol`, `permisos`, `recursos`, `rol_permisos_por_recurso` | Cierre para todas las cuentas; recuperación mediante correo institucional; segundo factor, categorías e historial de accesos administrados por Administración general |
| RF-AR1 a RF-AR5 | Sesión, Administración y navegación | `area`, `rol`, `empleado` | Áreas, ámbitos, separación administrativa y acceso restringido |
| RF-BE1 a RF-BE9 | Beneficiarias | `beneficiaria`, `residencia`, `beneficiaria_etnia`, catálogos geográficos y personales | Búsqueda previa, alta, coincidencias, perfil, estado e historial |
| RF-FA1 a RF-FA12 | Ficha de admisión | `ficha_inicial`, `agresor`, `nino`, `apoyo_recibido`, referencias y catálogos | Una ficha paginada; identificación, residencia, datos generales, salud, grupo familiar, motivo, violencia, medios de agresión, riesgo, referencias, episodio reciente, plan, evaluación, seguimiento, observaciones, borrador, versiones e impresión |
| RF-ED1 a RF-ED12 | Expedientes y documentos | `expediente`, `formulario_area`, `documento_area`, `revision_registro` | Carga, consulta, permisos, versiones encadenadas, anulación e inactivación |
| RF-HE1 a RF-HE8 | Hojas evolutivas | `hoja_evolutiva.accion`, `correlativo`, `area`, `beneficiaria` | Cada entrada exige acción realizada, contenido, área, autoría y fecha; agrupación, corrección, anulación e historial |
| Formularios de Psicología | Formularios de área / Psicología | `psicologia_mujer`, `psicologia_ninez`, `psicologia_examen_mental` | Variantes para mujer y niñez, evaluación, plan, notas e historial |
| Formularios de Trabajo Social | Formularios de área / Trabajo Social | `ficha_social`, `entrada_evolutiva` | Ficha social, riesgos, plan y seguimientos |
| Formularios de Medicina | Formularios de área / Medicina | `consulta_medica` y tipos en `tipo_formulario` | Tres variantes clínicas, examen, tratamiento, laboratorios y citas |
| Formularios de Legal | Formularios de área / Legal | Referencias parciales | Ficha legal, proceso, diligenciamiento y referencia |
| Ficha de Guardería | Formularios de área / Guardería | `ficha_guarderia`, `nino`, `familiar_declarado` | Ingreso, responsable, familia, escolaridad y salud |
| RF-AL1 a RF-AL10 | Albergue | `activos_albergue`, `estado_albergue`, `movimiento_albergue`, `nino` | Ingreso, estancia individual, bloqueo de segundo estado ACTIVO por CUI, conteo y distinción entre beneficiarias e infantes |
| RF-SA1 a RF-SA7 | Albergue | `movimiento_albergue`, `activos_albergue` | Salida temporal, retorno, egreso, grupos y alertas |
| RF-RE1 a RF-RE10 y correcciones de matriz del 19-10-2026 | Reportes | Datos de beneficiarias, fichas, seguimientos y albergue | Filtros, indicadores, cortes históricos; exportación institucional para Administración general y por ámbito para coordinaciones |
| PENDIENTE: informe consolidado de acciones y avance | Administración general y Reportes por confirmar | Posibles fuentes: `beneficiaria`, `ficha_inicial`, `hoja_evolutiva.accion`, `area` y formularios | Mockup exploratorio; confirmar responsable, acceso, contenido, conteos, período, vista previa e impresión antes de implementar |
| RNF-SE y RNF-PC | Toda la aplicación | `usuario`, `rol`, `permisos`, `area` y modelo de sesión pendiente | Sesión, capacidades, minimización, privacidad y mensajes seguros |
| RNF-US y RNF-CA | Sistema de diseño y módulos | No dependen de una tabla específica | Consistencia, validaciones, teclado, navegador y responsividad |
| RNF-RA | Consultas, documentos y reportes | `documento_area`, formularios y datos operativos v2 | Paginación, carga diferida, rendimiento percibido, progreso, cuotas y validación en hardware de 6 GB de RAM con AMD A8-7410 APU/Radeon R5 |
| RNF-TE | API compartida y manejo de errores | No dependen de una tabla específica | HTTPS, respuestas estructuradas, conflictos e incidentes |

## Plantilla para una historia de implementación

```markdown
# [Código] Nombre del comportamiento

## Fuente
- Requisito:
- Regla de negocio:
- Decisión aprobada:

## Resultado observable

## Alcance

## Fuera de alcance

## Permisos y ámbito

## Estados de interfaz
- Carga:
- Vacío:
- Correcto:
- Validación:
- Acceso denegado:
- Conflicto:
- Fallo:

## Contrato requerido de la API

## Entidades del diagrama y brechas

## Criterios de aceptación

## Pruebas

## Decisiones pendientes
```

## Ejemplo de trazabilidad

```text
RF-AL7
  → módulo shelter
  → formulario de persona alojada
  → contrato CreateShelteredPerson
  → prueba RF-AL7-CA01 con fecha de nacimiento
  → prueba RF-AL7-CA02 con fecha de nacimiento
  → prueba RF-AL7-CA03 sin introducir una edad o fecha ficticia
```

Cuando se cree el plan de implementación, cada fase debe enumerar los códigos que incorpora y las pruebas que demostrarán su cumplimiento.


