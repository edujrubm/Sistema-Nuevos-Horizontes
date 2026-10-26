# Autenticación y autorización

## Principio de decisión

Cada solicitud se decide con esta tupla:

```text
actor + capacidad + recurso + área + caso/persona + estado + vigencia
```

Un rol ayuda a reunir capacidades, pero no sustituye la decisión. Si ninguna asignación vigente concede la acción, se deniega. Una autorización excepcional incluye recurso, acción, responsable, aprobador, vigencia y ámbito; expira automáticamente y su revocación queda auditada.

## Capacidades sugeridas

Usar identificadores estables y granulares, por ejemplo:

```text
beneficiary.read_general
beneficiary.update
case_file.read_complete
case_file.print_complete
case_file.inactivate
case_file.restore
initial_intake.create|read|update|confirm|print
area_form.create|read|update|confirm|print
evolution.create|read|update
document.read|upload|download_general|download_area|annul
shelter.admit|read|temporary_exit|return|discharge
report.read|export
audit.read_changes|read_access
account.manage
mfa.manage
initial_category.manage
```

La matriz es la fuente de concesiones. No codificar condicionales como `role === 'DIRECTORA'` en controladores.

## Roles y alcance confirmado

- **Directora:** consulta general, áreas, Albergue y expediente completo; imprime expediente completo. Solo lectura.
- **Administración general:** cuentas, asignaciones, segundo factor, categorías, historial de accesos, inactivar/restaurar expediente y exportar reportes institucionales.
- **Coordinador de área:** actúa en su área/casos, consulta modificaciones de su ámbito, anula documentos propios y exporta reportes del área.
- **Profesionales:** Médico, Psicólogo, Abogado y Trabajador Social operan formularios/hoja de su área y casos asignados según matriz.
- **Coordinación y personal de Albergue:** operan estancias y movimientos conforme a la matriz; cualquier personal autorizado de Albergue puede registrar salida temporal.
- **Trabajadora de Guardería:** solo Guardería y casos asignados.
- **Digitalizador de ficha inicial:** captura la ficha inicial y las acciones expresamente concedidas.
- **Digitalizador de área:** captura formularios, documentos y evolución del área/caso asignados.
- **Secretaría:** solo capacidades expresas de la matriz.
- **Practicante:** no existe.

## Sesión y cuenta

- Toda cuenta puede cerrar sesión; revocar la sesión actual en servidor.
- Recuperación de contraseña solo si existe correo institucional verificado. La respuesta pública no revela si la cuenta existe.
- Tokens de recuperación y verificación se almacenan como hash, con un solo uso y expiración.
- Administración general configura/habilita el segundo factor cuando se apruebe el mecanismo; no puede leer secretos de autenticación.
- Cambios de contraseña, MFA, rol, ámbito, bloqueo y revocación de sesiones generan auditoría y, cuando corresponda, invalidan sesiones existentes.

## Implementación NestJS sugerida

1. Un guard autentica y crea `RequestPrincipal` mínimo.
2. Un decorador declara capacidad requerida, sin lógica de rol.
3. `AuthorizationService` carga asignaciones vigentes, ámbito y estado del recurso.
4. La consulta de repositorio incluye el ámbito permitido; no se recupera primero todo para filtrar en memoria.
5. El caso de uso vuelve a verificar condiciones que puedan cambiar dentro de la transacción.

Para respuestas: `401` cuando falta autenticación válida; `403` cuando la identidad está autenticada pero no autorizada. En búsquedas sensibles puede devolverse `404` para no revelar existencia, según una política uniforme.

## Matriz de pruebas obligatoria

Por cada capacidad probar: concesión correcta, otro rol, otro ámbito, caso no asignado, asignación expirada, excepción vigente/revocada, recurso inactivo/anulado y acceso de Dirección en solo lectura.
