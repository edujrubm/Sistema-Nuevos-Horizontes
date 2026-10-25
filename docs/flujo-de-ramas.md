# Flujo de ramas

`main` recibe únicamente Pull Requests que compilan y han sido revisados. Las ramas de área parten de `main` actualizado.

| Rama | Propiedad funcional |
|---|---|
| administracion | Usuarios, roles, permisos, catálogos y administración operativa |
| albergue | Estancias y movimientos |
| guarderia | Formulario y operaciones de Guardería |
| legal | Ficha Legal y referencias |
| medicina | Consulta médica y reglas propias |
| psicologia | Evaluaciones psicológicas y examen mental |
| social | Ficha y seguimiento social |

Las ramas de área no cambian unilateralmente el núcleo `beneficiaria`, `expediente`, `nino`, `formulario_area`, autenticación ni migraciones compartidas. Esos cambios se proponen en una rama transversal y se revisan antes de integrarse.
