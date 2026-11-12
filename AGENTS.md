# Instrucciones globales para agentes de IA

Estas reglas aplican a cualquier agente que lea, analice, modifique o pruebe
este repositorio. Las instrucciones de `docs/contexto/backend/AGENTS.md` y
`docs/contexto/frontend/AGENTS.md` agregan reglas para su área; no las
reemplazan.

## Orden obligatorio de consulta

1. Leer `docs/DECISIONES_Y_DUDAS.md`.
2. Leer `docs/GUIA_TECNICA.md` y el `AGENTS.md` más cercano al archivo que se
   vaya a modificar.
3. Comprobar el contrato, migración, prueba y código que afecte el cambio.
4. Aplicar únicamente una decisión marcada como **confirmada** o una petición
   explícita y acotada del equipo responsable.

## Prohibición de decidir por cuenta propia

Un agente no puede inventar ni elegir por sí mismo requisitos, campos,
obligatoriedad, catálogos, estados, transiciones, permisos, roles, reglas de
menores, retención, proveedor externo, esquema, migración, contrato de API,
mensaje institucional ni criterio clínico, jurídico o de riesgo.

El código existente, un mockup, una tabla de base de datos, una rama o una
prueba no son por sí solos aprobación de una regla de negocio. Si contradicen
una decisión confirmada, se conserva la decisión y se informa la discrepancia.

## Qué hacer ante una duda

1. Buscar si la respuesta está en una decisión confirmada, contrato o requisito aprobado.
2. Si no existe, no implementar una suposición ni una solución permanente.
3. Registrar o actualizar la entrada correspondiente en `docs/DECISIONES_Y_DUDAS.md` con el formato `D-XX`.
4. Formular al equipo una pregunta concreta: qué debe decidir, opciones,
   impacto y qué parte queda bloqueada.
5. Detener sólo la parte dependiente de la respuesta; continuar únicamente con
   trabajo reversible que no cambie el comportamiento de negocio.
6. Al recibir la respuesta explícita del equipo, registrar responsable, fecha,
   resolución y archivos modificados antes de darla por confirmada.

## Convenciones de cambio

- Respetar módulos, contratos, nombres, idioma y capas existentes.
- Usar las herramientas exactamente como indica `docs/GUIA_TECNICA.md`; no usar
  SQL en controladores, sincronización automática del ORM ni migraciones no
  aprobadas.
- No eliminar datos, modificar una migración aplicada, exponer información
  sensible ni ejecutar escrituras contra un ambiente compartido sin autorización.
- Ejecutar la verificación aplicable y reportar con precisión qué se comprobó y
  qué quedó pendiente.

Cuando una instrucción del usuario contradiga este archivo, pedir al equipo que
aclare el cambio de decisión antes de alterar las reglas institucionales.
