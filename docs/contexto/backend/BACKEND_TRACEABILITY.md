# Trazabilidad del backend

| Fuente | Módulo | Persistencia/contrato | Evidencia principal |
|---|---|---|---|
| RF-GU1–RF-GU12, RF-AR1–RF-AR5 | Identity, Administration | cuenta, sesión, asignación, rol, capacidad, ámbito | matriz de autorización, cierre, recuperación, MFA e historiales |
| RF-BE1–RF-BE9 | Beneficiaries | beneficiaria, residencia, catálogos, revisiones | búsqueda, duplicados, perfil, inactivar/restaurar |
| RF-FA1–RF-FA12 | Initial Intake | ficha, secciones, agresores, hijos, riesgos, referencias | borrador único, confirmación atómica, 19 apartados |
| RF-ED1–RF-ED12 | Documents/Case File | `expediente`, `formulario_area`, `documento_area`, `revision_registro` | carga privada, acceso, versión, inactivación e impresión |
| RF-HE1–RF-HE8 | Evolution | hoja, entrada, acción, revisión | acción obligatoria, fecha servidor, edición auditada |
| Formularios Psicología | Area Records | `psicologia_mujer`, `psicologia_ninez`, `psicologia_examen_mental` | permisos, variantes, confirmación y revisiones |
| Formularios Trabajo Social | Area Records | `ficha_social`, `entrada_evolutiva` | vínculo único sin duplicar entrada |
| Formularios Medicina | Area Records | `consulta_medica` con tres códigos de tipo | validación por variante y ámbito |
| Formularios Legal | Area Records | `ficha_legal`, `referencia_legal` | referencia sin conceder acceso destino |
| Formulario Guardería | Area Records | `ficha_guarderia`, `nino`, `familiar_declarado` | selección existente y control de duplicado |
| RF-AL1–RF-AL10 | Shelter | estancia individual y estado | unicidad activa y conteo por tipo de persona |
| RF-SA1–RF-SA7 | Shelter | salida, retorno, egreso | máquina de estados y concurrencia |
| RF-RE1–RF-RE10 | Reports | consultas agregadas y trabajos | semántica de conteo, ámbito y exportación |
| RN-AU3/RN-AU4 | Authorization/Audit | catálogo versionado y excepciones | denegación predeterminada, vigencia y auditoría |
| RNF-SE/RNF-PC | Todos | controles, logs, cifrado | pruebas de seguridad y revisión de privacidad |
| RNF-RA/RNF-TE | API/Operations | paginación, jobs y observabilidad | carga, límites, latencia y recuperación |

## Plantilla por historia

```markdown
# [Código] comportamiento
## Fuente y decisión aprobada
## Actor, capacidad, área y caso
## Precondiciones e invariantes
## Comando/consulta y respuesta
## Transacción y concurrencia
## Auditoría
## Errores públicos
## Migración e índices
## Pruebas
## Decisiones pendientes
```

## Brechas que bloquean contratos definitivos

- Ejecución verificada de `02_ampliacion_formularios.sql` y conciliación de datos/constraints existentes.
- Validación operativa del modelo v2: `activos_albergue` para beneficiaria y `estancia_nino` subordinada para hijos.
- Modelo de roles múltiples y asignación de casos.
- Campos, obligatoriedad y catálogos finales de formularios de área.
- Proveedor y política documental.
- Indicadores/reportes finales y catálogo de acciones.
- Segundo factor, sesiones y política de retención.

Estas brechas no impiden crear módulos, puertos y pruebas de políticas; sí impiden fijar enums, columnas o respuestas como definitivas.


## Trazabilidad arquitectónica MVC

Cada historia backend debe identificar el Controller, Service, Model/Repository y View/Presenter afectados. Las pruebas de controlador verifican el contrato HTTP; las pruebas de servicio verifican reglas y autorización; las pruebas de repositorio verifican PostgreSQL; las pruebas del presenter comprueban minimización y forma de la respuesta.
