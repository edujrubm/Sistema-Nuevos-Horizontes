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

## Verificación mientras Actions no está disponible

GitHub Actions queda documentado como no disponible temporalmente por una restricción de facturación. Esto no bloquea el flujo de trabajo. Antes de abrir o aprobar un Pull Request se ejecuta localmente:

```sh
pnpm install --frozen-lockfile
pnpm run build
```

La persona responsable debe reportar el resultado en la descripción del Pull Request. El merge requiere además revisión de código, ausencia de conflictos y confirmación de que no se incluyen credenciales ni datos personales.
