# Módulo de Seguridad — Sistema Nuevos Horizontes

> **Entrega parcial para integración de frontend — v1 (23 de noviembre de 2026).**
>
> Este archivo documenta el comportamiento **implementado en el módulo de Seguridad** y las precauciones para continuar el desarrollo. No certifica que todos los controladores del sistema estén protegidos ni que esta versión esté lista para producción.

## 1. Propósito y alcance

El módulo `src/modules/seguridad` implementa autenticación mediante usuario y contraseña, emisión y validación de JWT, sesiones revocables almacenadas en PostgreSQL y autorización basada en permisos y ámbitos. También contiene operaciones administrativas de gestión de cuentas.

**Incluido en esta entrega:** login, perfil autenticado, logout, cambio de contraseña propia, creación administrativa de usuarios y activación/desactivación administrativa, además de Guards y decoradores reutilizables.

**Fuera de alcance:** protección integral de Ficha Inicial y de todos los módulos de negocio; restablecimiento administrativo de contraseña mediante endpoint (el permiso SQL por sí solo no crea la API); verificación por correo, segundo factor y dispositivos confiables. Estos puntos no deben asumirse implementados.

## 2. Tecnologías y ubicación

- NestJS + TypeScript.
- PostgreSQL, esquema `new_horizons`; TypeORM para entidades y consultas SQL parametrizadas donde corresponde.
- `@nestjs/jwt` para firma y validación JWT (HS256).
- `argon2` para verificar y almacenar contraseñas de forma segura.
- `class-validator` para validar DTOs.
- Controlador: `seguridad.controller.ts`.
- Servicio: `seguridad.service.ts`.
- Módulo: `seguridad.module.ts`.
- Entidades: `entities/{usuario,empleado,rol}.entity.ts`.
- DTOs: `dto/{login,crear-usuario,cambiar-contrasena}.dto.ts`.
- Guards: `guards/{jwt-auth,permisos,ambito,beneficiaria-ambito}.guard.ts`.
- Decoradores: `decorators/{requiere-permiso,requiere-ambito,permitir-cambio-contrasena-pendiente}.decorator.ts`.

El módulo debe estar registrado en `src/app.module.ts`. **Los Guards no son globales**: cada controlador de negocio debe aplicarlos explícitamente según la operación.

## 3. Configuración y puesta en marcha

1. Partir de la estructura SQL base del proyecto, incluida la estructura de autorización institucional (`database/03_autenticacion_autorizacion.sql` o la ruta que indique la documentación vigente del repositorio). Verificar también las migraciones previas que correspondan al entorno.
2. Aplicar **una única vez y en orden**, tras revisar prerrequisitos y respaldar la base de datos, `database/migrations/008_...sql` hasta `014_...sql`.
3. Configurar conexión a PostgreSQL de acuerdo con `src/database/` y establecer `JWT_SECRET` con un secreto fuerte y privado en el entorno. **No publicar `.env`, hashes, JWT ni contraseñas reales.**
4. Instalar dependencias desde el lockfile: `pnpm install --frozen-lockfile`.
5. Comprobar código: `pnpm run build`; iniciar: `pnpm run start:dev`.
6. Confirmar en los logs que Nest registra `SeguridadController` con el prefijo `/api/seguridad` (el prefijo global debe verificarse en `src/main.ts`).

El archivo `pnpm-workspace.yaml` autoriza de forma específica scripts de instalación necesarios para las dependencias de este proyecto; revisar esas excepciones antes de cambiarlas.

**No ejecutar indiscriminadamente migraciones en una base ya migrada:** la migración 011 añade una restricción `UNIQUE` no idempotente y puede fallar si la restricción ya existe o hay duplicados por empleado. Es necesario conocer qué migraciones ya se aplicaron.

## 4. Contrato HTTP: endpoints

Base local esperada: `http://localhost:3001/api` **solo si el backend está configurado para escuchar en el puerto 3001**. Los clientes deben definir una `BASE_URL` configurable; no fijar `localhost` para los equipos de otros desarrolladores.

| Método | Ruta | ¿JWT? | Autorización/uso |
| --- | --- | --- | --- |
| `POST` | `/seguridad/login` | No | Usuario y contraseña; entrega JWT |
| `GET` | `/seguridad/perfil` | Sí | Identidad validada de la sesión actual |
| `POST` | `/seguridad/logout` | Sí | Revoca únicamente la sesión actual |
| `PATCH` | `/seguridad/cambiar-contrasena` | Sí | Cambia contraseña propia |
| `POST` | `/seguridad/usuarios` | Sí | Permiso `crear:usuarios` |
| `PATCH` | `/seguridad/usuarios/:id/desactivar` | Sí | Permiso `inhabilitar:usuarios` |
| `PATCH` | `/seguridad/usuarios/:id/reactivar` | Sí | Permiso `habilitar:usuarios` |

En esta rama se eliminan las rutas temporales `prueba-*`. No reconstruirlas ni consumirlas desde frontend como API pública.

### 4.1 Login

`POST /api/seguridad/login`, JSON:

```json
{
  "nombre_usuario": "usuario_ejemplo",
  "contrasena": "<CONTRASENA_DEL_USUARIO>"
}
```

Validaciones conocidas: `nombre_usuario` es string no vacío, máximo 60 caracteres; `contrasena` es string no vacío.

Respuesta exitosa `200 OK` (ejemplo ilustrativo; los ID reales provienen de PostgreSQL):

```json
{
  "access_token": "<JWT>",
  "token_type": "Bearer",
  "expires_in": 900,
  "debe_cambiar_contrasena": false,
  "usuario": {
    "id_usuario": "38",
    "nombre_usuario": "usuario_ejemplo",
    "empleado": {
      "id_empleado": "38",
      "nombre": "Empleado de ejemplo"
    },
    "rol": {
      "id_rol": "17",
      "tipo_rol": "<ROL_VIGENTE>",
      "id_area": null
    }
  }
}
```

Los identificadores de PostgreSQL pueden serializarse como strings. El frontend debe tratar los ID como identificadores, no convertirlos a números de JavaScript sin necesidad.

El servicio verifica cuenta activa, hash Argon2, empleado asociado y rol existente. Tras validar, genera un UUID de sesión, registra su vencimiento en `new_horizons.sesion_usuario` dentro de una transacción y firma un JWT cuyo payload incluye `sub`, `empleado_id` y `sid`. La respuesta **no** incluye hashes ni contraseñas.

**Duración actual: 900 segundos (15 minutos).** La duración está configurada en `seguridad.module.ts` y también en `seguridad.service.ts` (token, registro SQL y `expires_in`). Si se modifica, hay que mantener sincronizados estos valores y probar vencimiento/revocación; no basta con cambiar un solo archivo.

Credenciales inválidas: `401 Unauthorized`, mensaje `Usuario o contraseña incorrectos`. Un empleado sin rol válido también se rechaza; no exponer distinciones sensibles innecesarias en la interfaz.

### 4.2 Peticiones autenticadas

Enviar la cabecera HTTP:

```http
Authorization: Bearer <JWT>
```

`GET /api/seguridad/perfil` devuelve:

```json
{
  "mensaje": "Autenticación correcta",
  "usuario": {
    "id_usuario": "38",
    "id_empleado": "38",
    "id_rol": "17",
    "tipo_rol": "<ROL_VIGENTE>",
    "id_area": null,
    "id_sesion": "<UUID_DE_SESION>"
  }
}
```

**El perfil no tiene exactamente la misma estructura anidada que `login`.** El frontend debe normalizar los datos si requiere un único modelo de usuario. No asumir que `perfil` devuelve `nombre_usuario` o `empleado.nombre`.

`POST /api/seguridad/logout` revoca la sesión actual identificada por el `sid` del JWT. El cliente debe borrar su credencial local al completar logout; nunca asumir que cerrar sesión invalida todas las sesiones del usuario.

### 4.3 Cambio de contraseña propia

`PATCH /api/seguridad/cambiar-contrasena`, con JWT:

```json
{
  "contrasena_actual": "<ACTUAL>",
  "contrasena_nueva": "<NUEVA_DE_AL_MENOS_12_CARACTERES>",
  "confirmar_contrasena": "<MISMA_NUEVA>"
}
```

Validación DTO: los tres valores son strings no vacíos; contraseña nueva mínimo 12 y máximo 128 caracteres. La lógica del servicio debe verificarse antes de documentar códigos/mensajes exactos. Al cambiar la contraseña, el flujo implementado revoca sesiones: el frontend debe solicitar nuevo login después del éxito.

Si el login devuelve `debe_cambiar_contrasena: true`, dirigir al usuario al flujo de cambio obligatorio, evitando el acceso a las demás pantallas. `GET /perfil`, `POST /logout` y `PATCH /cambiar-contrasena` están expresamente permitidos durante ese estado; los demás endpoints protegidos con `JwtAuthGuard` responden `403` hasta completar el cambio.

### 4.4 Crear cuenta administrativa

`POST /api/seguridad/usuarios`, con JWT y permiso `crear:usuarios`:

```json
{
  "id_empleado": "123",
  "nombre_usuario": "usuario.ejemplo",
  "contrasena": "<CONTRASENA_DE_AL_MENOS_12_CARACTERES>"
}
```

DTO: `id_empleado` **string** de entero positivo sin cero inicial (`^[1-9]\\d*$`), `nombre_usuario` de 4 a 60 caracteres (`A–Z`, `a–z`, `0–9`, `.`, `_`, `-`), contraseña de 12 a 128 caracteres. Éxito: HTTP `201 Created`. Consultar el método de servicio para la estructura exacta de respuesta y errores de conflicto; no inventarlos.

Los endpoints `PATCH /usuarios/:id/desactivar` y `PATCH /usuarios/:id/reactivar` reciben el identificador por URL, requieren los permisos indicados y utilizan auditoría administrativa. La desactivación revoca las sesiones del usuario afectado.

## 5. JWT y sesión: validación real

`JwtAuthGuard`:

1. Exige una cabecera `Authorization` con esquema **exactamente** `Bearer` y un solo token.
2. Verifica la firma y algoritmo **HS256** y la expiración del JWT.
3. Valida la forma del payload (`sub`, `empleado_id` como strings numéricos y `sid` como UUID).
4. Comprueba que la sesión exista en `new_horizons.sesion_usuario`, no esté revocada y no haya expirado.
5. Verifica que la cuenta esté activa y consulta el indicador `debe_cambiar_contrasena`.
6. Verifica vínculo del empleado y existencia del rol **en la base de datos actual**, no solo en los claims originales.
7. Adjunta a `request.usuario`: `id_usuario`, `id_empleado`, `id_rol`, `tipo_rol`, `id_area`, `id_sesion`.

Respuestas esperables: `401` sin token, con token mal formado, inválido, vencido o sesión revocada; `403` cuando el usuario tiene cambio obligatorio pendiente y el endpoint no está exceptuado, o carece de autorización.

**No confiar en el rol enviado o decodificado por el frontend como control de seguridad:** ocultar una pantalla es solo UX; la autorización real debe mantenerse en backend.

## 6. Permisos y ámbitos

- `@UseGuards(JwtAuthGuard, PermisosGuard)` exige autenticación y autorización.
- `@RequierePermiso('crear', 'usuarios')` declara acción y recurso. El Guard coteja esos valores con la matriz `new_horizons.rol_permisos_por_recurso` y los catálogos `permisos` y `recursos`.
- `AmbitoGuard` y `@RequiereAmbito(...)` sirven para restricciones por área/expediente; revisar la implementación concreta antes de extenderlos.
- `BeneficiariaAmbitoGuard` limita acceso a beneficiarias según ámbito; se proporciona como componente reutilizable, **no** implica que toda ruta de Beneficiarias esté protegida.
- `@PermitirCambioContrasenaPendiente()` exceptúa un endpoint del bloqueo por contraseña temporal, **sin omitir la autenticación**.

Ejemplo de protección de endpoint nuevo:

```ts
@Get('recurso-privado')
@UseGuards(JwtAuthGuard, PermisosGuard)
@RequierePermiso('consultar', 'nombre_recurso_existente')
obtenerRecurso() { /* ... */ }
```

No inventar nuevos nombres de acciones o recursos: comprobar primero los catálogos SQL. **Un permiso por rol no reemplaza las comprobaciones de pertenencia del registro**, especialmente en Ficha Inicial, expedientes y archivos.

## 7. PostgreSQL y migraciones

Dependencias previas del esquema `new_horizons`: `usuario`, `empleado`, `rol`, `permisos`, `recursos`, `rol_permisos_por_recurso` y `revision_registro`. Las migraciones aquí descritas son **incrementales**; no construyen desde cero toda la base institucional.

| Migración | Cambio |
| --- | --- |
| `008_sesiones_usuario.sql` | Tabla `sesion_usuario` (UUID, usuario, creación, expiración, revocación) e índices |
| `009_habilitar_usuarios.sql` | Permiso `habilitar:usuarios` para `administrador_general` |
| `010_auditoria_estado_usuarios.sql` | Auditoría de activación/desactivación con contexto de actor y motivo |
| `011_usuario_empleado_unico.sql` | Restricción `UNIQUE (id_empleado)` en `usuario` |
| `012_auditoria_creacion_usuarios.sql` | Extiende auditoría a INSERT y UPDATE de estado; no almacena hashes ni tokens |
| `013_restringir_restablecimiento_usuarios.sql` | Reserva `restablecer:usuarios` para `administrador_general`; **no** agrega endpoint REST |
| `014_cambio_contrasena_obligatorio.sql` | `usuario.debe_cambiar_contrasena` booleano, por defecto `FALSE` |

La migración `007_area_albergue.sql` no forma parte de esta entrega de autenticación. La `015_creador_ficha_inicial.sql` **se excluye deliberadamente**, porque corresponde a trabajo independiente sobre Ficha Inicial. No añadirla de forma implícita.

**Advertencias de aplicación:** la 011 puede fallar por duplicados o si ya existe la restricción. Las migraciones 010 y 012 modifican un trigger de auditoría: deben ejecutarse en orden, preservando el contexto `new_horizons.actor_id` y `new_horizons.motivo` usado por el servicio. Aplicar en una BD de prueba y confirmar los cambios antes de ejecutarlas sobre datos reales.

## 8. Guía de integración frontend

1. Configurar `BASE_URL` por ambiente y consumir `POST /seguridad/login`.
2. Mostrar mensaje genérico ante `401` de credenciales y permitir reintento.
3. Conservar `access_token` en un mecanismo de sesión acorde a la plataforma y a las políticas del proyecto; **evitar almacenamiento accesible por scripts en contextos expuestos a XSS**. Nunca registrar tokens en consola, analíticas o repositorios.
4. Enviar `Authorization: Bearer <token>` en rutas protegidas.
5. Al iniciar la aplicación, consultar `/seguridad/perfil` para validar la sesión actual; no considerar auténtico al usuario solo por tener un token guardado.
6. Si `debe_cambiar_contrasena` es `true`, mostrar exclusivamente el flujo de cambio obligatorio y logout.
7. Si una petición devuelve `401`, invalidar el estado de autenticación y pedir nuevo login. Si devuelve `403`, mostrar acceso denegado o flujo de cambio obligatorio según el motivo.
8. Al salir, llamar `POST /seguridad/logout` y eliminar el token del cliente, incluso si el servidor no está disponible para responder.
9. No asumir renovación automática: **no hay refresh token documentado en esta entrega**. `expires_in = 900`.
10. `login.usuario` tiene datos anidados de empleado/rol; `perfil.usuario` ofrece identidad plana. Implementar normalización explícita.

Para aplicaciones web, evaluar con el equipo si usar cookies `HttpOnly` gestionadas por backend en lugar de persistir bearer tokens en almacenamiento del navegador. La presente API devuelve el bearer token en JSON.

## 9. Pruebas de aceptación antes de entregar

La compilación (`pnpm run build`) y el arranque de NestJS ya se comprobaron durante la preparación de la rama. **Estas comprobaciones no equivalen a pruebas de integración completas.** Validar, con cuentas de prueba en una BD aislada:

- Login exitoso, JWT y datos del usuario.
- Login con contraseña incorrecta → `401`.
- `/perfil` sin token → `401`; con token válido → `200` y estructura plana.
- `/logout` con token válido → revocación; reutilizar el mismo token → `401`.
- Cambiar contraseña con valores válidos; comprobar revocación de sesiones y necesidad de nuevo login.
- Usuario con `debe_cambiar_contrasena = true`: acceso a cambio/perfil/logout; bloqueo de endpoints normales con `403`.
- Crear usuario con permiso y sin él; revisar `201` y `403` respectivamente.
- Desactivar usuario; rechazar sesiones existentes. Reactivar solo con permiso.
- Verificar que `prueba-*` no aparezca en rutas de NestJS.
- Confirmar que crear cuentas y cambiar estados genera auditoría sin registrar contraseñas ni hashes.
- `pnpm exec jest --runInBand`, `pnpm run build` y `git diff --check`.

**Los usuarios de prueba y sus contraseñas no forman parte del repositorio.** Crear cuentas de prueba de forma controlada; no compartir credenciales reales ni scripts que inserten hashes secretos conocidos.

## 10. Decisiones técnicas y límites conocidos

- JWT corto, HS256 y sesión en BD permiten revocación anticipada aunque la firma siga vigente.
- El rol se consulta en cada petición protegida, de modo que los cambios de rol tengan efecto sin depender de claims de permisos obsoletos.
- Operaciones de cuentas se auditan en `revision_registro` con responsable y motivo; no almacenar secretos.
- `JwtAuthGuard` no es global; **los demás controladores no quedan protegidos por importar este módulo**.
- No considerar seguros en producción los recursos de Ficha Inicial o cualquier controlador que carezca de comprobación de ámbito a nivel de registro.
- La duración de **8 horas** fue discutida como mejora futura, **no está implementada**; actualmente son **15 minutos** y no se dispone de renovación automática documentada.
- Verificación por correo, recuperación de contraseña, segundo factor y dispositivos confiables son **pendientes**.
- Antes de publicar una rama común, revisar CORS, variables de entorno, datos de prueba, error handling, esquema de base de datos y entorno backend accesible para el frontend.

## 11. Contexto y reglas para otros agentes de IA

**Objetivo de esta rama:** entregar al equipo un contrato de autenticación funcional para comenzar el frontend, sin fusionar cambios incompletos de permisos específicos de expedientes y Ficha Inicial.

**Rama de referencia de desarrollo:** `autenticacion`. **Rama de entrega:** `entrega/autenticacion-frontend-v1`. La rama de entrega parte del `origin/main` observado al crearla y traslada deliberadamente solo Seguridad, dependencias y migraciones 008–014. Pueden existir commits posteriores en remoto: verificar Git antes de fusionar.

**Instrucciones operativas:**

1. Leer este README y los archivos fuente **antes** de afirmar contratos o comportamientos.
2. Revisar `git status`, rama y diferencias antes de modificar o fusionar. No hacer merge completo de `autenticacion` por accidente.
3. Mantener nombres de rutas y recursos en español y respetar el prefijo `/api` que configure el backend.
4. Usar DTOs validados, SQL parametrizado y transacciones cuando una operación cambie sesiones/auditoría.
5. No introducir nuevas rutas administrativas sin `JwtAuthGuard`, `PermisosGuard` y permiso explícito.
6. No proteger únicamente por rol mostrado en frontend; verificar autorización y ámbito en backend, incluido el registro concreto.
7. No incluir migración 015 ni cambios sobre Ficha Inicial como parte de este paquete sin una decisión de alcance explícita.
8. No insertar credenciales, `JWT_SECRET`, tokens, correos privados ni datos institucionales reales en tests, ejemplos o commits.
9. Tras cambios en JWT, sincronizar firma, `expira_en` SQL y `expires_in` de respuesta; comprobar caducidad y logout.
10. Registrar en este README **solo resultados realmente probados**; distinguir pruebas unitarias, compilación, inicio e integración.

## 12. Pendientes para la siguiente iteración

- Ejecutar la batería de pruebas HTTP de la sección 9 sobre la rama de entrega y conservar evidencias.
- Preparar colección Postman con variables `base_url`, `access_token` y usuarios de prueba no sensibles.
- Confirmar instalación de migraciones en una BD recién inicializada según el procedimiento oficial del repositorio.
- Definir la política definitiva de duración de sesión, refresh/renovación y gestión de múltiples dispositivos.
- Implementar los flujos de correo/segundo factor/dispositivos confiables solo cuando exista un servicio de envío validado.
- Completar autorización de registros y expedientes en todos los módulos antes de exponer el backend a usuarios reales.
- Definir acceso compartido de desarrollo para frontend; no asumir que `localhost` de cada compañero es el servidor del backend.

---

**Fuente de verdad:** controladores, DTOs, Guards, servicios, migraciones y pruebas del repositorio. Si este documento y el código difieren, investigar la diferencia, actualizar pruebas/documentación y evitar que el frontend dependa de una suposición.
