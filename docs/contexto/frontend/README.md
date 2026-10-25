# Contexto de frontend de Nuevos Horizontes

Este directorio contiene la base documental para diseñar e implementar el frontend del sistema web de gestión de beneficiarias, expedientes y albergue de la Asociación Nuevos Horizontes, sede Quetzaltenango.

El contenido se limita al cliente web en React. La arquitectura, seguridad, persistencia y contratos definitivos del backend se documentarán por separado. Cuando una decisión depende del backend o de aprobación institucional, se registra como pendiente en lugar de asumirla.

## Orden de lectura

1. `AGENTS.md`: reglas que debe seguir Codex al trabajar en el frontend.
2. `FRONTEND_ARCHITECTURE.md`: estructura, capas, módulos y flujo de datos.
3. `FRONTEND_DESIGN_SYSTEM.md`: paleta, tipografía, estructura visual y accesibilidad.
4. `FRONTEND_FORMS.md`: estructura de pestañas y comportamiento de los formularios.
5. `FRONTEND_DATA_MODEL.md`: correspondencia entre pantallas, datos del diagrama y requisitos nuevos.
6. `FRONTEND_STANDARDS.md`: convenciones de implementación y verificación.
7. `FRONTEND_DECISIONS.md`: decisiones propuestas, pendientes y límites actuales.
8. `FRONTEND_TRACEABILITY.md`: correspondencia inicial entre requisitos, módulos y datos.

## Fuentes del contexto

- Anteproyecto del sistema web modular de Nuevos Horizontes: `C:/Users/tzica/Desktop/ANTEPROYECTO .docx`.
- [Hoja de Requerimientos, versión 3](https://docs.google.com/document/d/1XZ_uqt6Y2ozrz20c7iSKW9MOt6EOIZxEe79pF2YU3Lo/edit).
- [Matriz de permisos de trabajo](https://docs.google.com/spreadsheets/d/1pi03rXqpIT49Sif7QZjsuQ8z1aox4QPICrB4Hp4DXpI/edit): actualizada con los roles de Guardería y digitalización y con las funciones de sesión, recuperación, segundo factor, historiales, descargas segmentadas, anulación documental, categorías y exportación; reemplaza la matriz de roles de la V3 para el diseño del frontend mientras se concilian ambos documentos.
- Diagrama unificado v2 y ampliación SQL del 24 de octubre de 2026: `D_diagrama_unificado.pdf` y `02_ampliacion_formularios.sql`. El script está pendiente de ejecución en PostgreSQL de ensayo.
- Inventario institucional de formularios y bocetos de Albergue: `C:/Users/tzica/Downloads/Formularios.md`, normalizado en `FRONTEND_FORMS.md`.
- Guía visual y escala tipográfica ampliada entregada por el equipo, normalizada en `FRONTEND_DESIGN_SYSTEM.md`.

Al copiar este paquete al repositorio, conservar referencias accesibles o una copia versionada y autorizada de estas fuentes. Las rutas locales identifican los documentos consultados durante la preparación; pueden cambiar en otra computadora.

La Hoja de Requerimientos V3 define el comportamiento solicitado, excepto donde la matriz de permisos de trabajo refleja cambios posteriores indicados por el equipo: se retira Practicante, la Directora queda limitada a consulta e impresión, se incorpora Trabajadora de Guardería y se añaden dos roles de digitalización. El esquema unificado v2 concreta el expediente, formularios de área, evolución, documentos y estancia infantil, pero todavía no constituye una implementación confirmada hasta ejecutar y verificar la migración. Ante diferencias, registrar la brecha y actualizar el diseño de datos y el contrato de API antes de integrar la pantalla. Las decisiones `PV1` a `PV10` requieren conciliación con los cambios posteriores.

## Uso recomendado

Copiar estos archivos al repositorio antes de iniciar el frontend. `AGENTS.md` debe colocarse en la raíz del repositorio o dentro del directorio del frontend, según el alcance deseado. Antes de programar una fase, debe existir un plan con requisitos, alcance, criterios de aceptación y pruebas esperadas.

## Mockups funcionales disponibles

- `../mockup_ficha_inicial.html`: ficha de admisión paginada.
- `../mockup_modulo_psicologia.html`: ficha psicológica y hoja evolutiva psicológica.
- `../mockup_modulo_medicina.html`: variantes médicas, examen, tratamiento y hoja evolutiva médica.
- `../mockup_modulo_legal.html`: ficha legal, proceso, diligenciamiento y hoja evolutiva legal.
- `../mockup_modulo_guarderia.html`: ficha de Guardería vinculada con hijas e hijos de la ficha inicial y hoja evolutiva de Guardería.
- `../mockup_modulo_albergue.html`: estancias y movimientos de Albergue.
- `../mockup_modulo_trabajo_social.html`: ficha social, diagnóstico, riesgos, plan y seguimiento evolutivo.
- `../mockup_psicologia_infantil.html`: variante psicológica para niña o niño vinculado desde la ficha inicial.
- `../mockup_referencia_legal.html`: hoja de referencia del Área Legal con vista previa de impresión.
- `../mockup_beneficiarias_expediente.html`: búsqueda, datos generales, historial, relaciones familiares e inactivación administrada.
- `../mockup_expediente_direccion.html`: consulta e impresión del expediente completo para Dirección.
- `../mockup_documentos_area.html`: documentos propios del área, carga y control de versiones.
- `../mockup_administracion_accesos.html`: cuentas, roles, ámbitos y matriz de permisos vigente.
- `../mockup_auditoria.html`: filtros y detalle del registro de auditoría.
- `../mockup_autenticacion.html`: inicio de sesión y recuperación de acceso.
- `../mockup_reportes_generales.html`: indicadores generales y de Albergue, separados del consolidado pendiente.
- `../mockup_modulo_administracion_general.html`: propuesta visual pendiente de confirmar para el informe consolidado; no representa una función aprobada.

Las hojas evolutivas de los mockups exigen fecha, acción realizada y detalle. Cada nueva entrada se agrega al historial cronológico del área y no reemplaza entradas anteriores.

## Estado

- Estado: borrador inicial para revisión del equipo.
- Alcance: frontend React.
- Backend: fuera de alcance en esta versión.
- Fecha de referencia: 19 de octubre de 2026.

