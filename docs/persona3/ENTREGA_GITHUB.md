# Entrega del backend de persona 3

Fecha: 30 de octubre de 2026.

## Ramas

- `evolucion`: soporte interno de persona 3, modelos y contratos de nuestras áreas, hojas evolutivas, historial y carga privada de PDF. Incluye herramientas, documentación y pruebas del conjunto. No activa los controladores específicos de Social, Legal y Guardería.
- `legal`: parte de `evolucion` y activa las rutas de Legal y referencias.
- `social`: parte de `evolucion` y activa las rutas de Trabajo Social.
- `guarderia`: parte de `evolucion` y activa las rutas de Guardería.

Los commits de soporte son los mismos ancestros en todas nuestras ramas para evitar duplicarlos al integrar. La organización conserva los módulos existentes del repositorio. No se cambia `main`, no se integra código de otras personas y no se aplican migraciones a la base compartida.

## Validación

Con los módulos de las tres áreas integrados localmente: `pnpm install --frozen-lockfile` y `pnpm test:persona3`. El script compila y ejecuta pruebas HTTP con PostgreSQL local y datos sintéticos. Requiere PostgreSQL 18 instalado; se puede configurar su ubicación en el script.

Las pruebas completas y Postman incluyen varias áreas: no deben ejecutarse como si todas las rutas estuvieran activas en una rama de área aislada. Cada rama debe compilar.

## Alcance pendiente

La autenticación real queda para la integración final. El ámbito local de pruebas no es autenticación de producción. El contrato de errores ya está implementado en nuestra entrega. Las propuestas de cambios de BD por diferencias con mockups están en `REVISION_BD_MOCKUPS_PERSONA3.md` y no se aplicaron al esquema compartido.

Los PDF de prueba son sintéticos. El almacenamiento real, archivos subidos, credenciales, dependencias y resultados de pruebas se excluyen del repositorio.

La rama adicional de integración fue eliminada por instrucción del usuario. Las comprobaciones conjuntas se hacen en un checkout temporal separado, sin crear ni publicar otra rama.
