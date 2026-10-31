# Entrega del backend de persona 3

Fecha: 30 de octubre de 2026.

## Ramas

- `evolucion`: soporte interno de persona 3, modelos y contratos de nuestras áreas, hojas evolutivas, historial y carga privada de PDF. Incluye herramientas, documentación y pruebas del conjunto. No activa los controladores específicos de Social, Legal y Guardería.
- `legal`: parte de `evolucion` y activa las rutas de Legal y referencias.
- `social`: parte de `evolucion` y activa las rutas de Trabajo Social.
- `guarderia`: parte de `evolucion` y activa las rutas de Guardería.
- `persona3/ciclo2`: integración de las tres ramas de área; contiene las 14 rutas asignadas más la carga PDF. Usar esta rama para ejecutar la colección completa de Postman y las pruebas de integración.

Los commits de soporte son los mismos ancestros en todas nuestras ramas para evitar duplicarlos al integrar. La organización conserva los módulos existentes del repositorio. No se cambia `main`, no se integra código de otras personas y no se aplican migraciones a la base compartida.

## Validación

Desde la rama integrada: `pnpm install --frozen-lockfile` y `pnpm test:persona3`. El script compila y ejecuta pruebas HTTP con PostgreSQL local y datos sintéticos. Requiere PostgreSQL 18 instalado; se puede configurar su ubicación en el script.

Las pruebas completas y Postman incluyen varias áreas: no deben ejecutarse como si todas las rutas estuvieran activas en una rama de área aislada. Cada rama debe compilar.

## Alcance pendiente

La autenticación real queda para la integración final. El ámbito local de pruebas no es autenticación de producción. El contrato de errores está documentado, pero su normalización global sigue pendiente. Las propuestas de cambios de BD por diferencias con mockups están en `REVISION_BD_MOCKUPS_PERSONA3.md` y no se aplicaron al esquema compartido.

Los PDF de prueba son sintéticos. El almacenamiento real, archivos subidos, credenciales, dependencias y resultados de pruebas se excluyen del repositorio.

## Resultado verificado el 30 de octubre de 2026

- Instalación en un clon nuevo con lockfile congelado: correcta.
- Integración `persona3/ciclo2`: compilación correcta y 26 pruebas HTTP/BD aprobadas, cero fallos.
- Postman ejecutado con Newman dentro de las pruebas: 14 peticiones y 21 comprobaciones aprobadas.
- Compilación independiente de `evolucion`, `legal`, `social` y `guarderia`: correcta.
- No se ejecutaron cambios sobre la base compartida.
