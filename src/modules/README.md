# Convención de módulos

Cada módulo funcional crea esta estructura cuando se implementa:

```text
nombre-modulo/
├── controllers/  # Rutas HTTP o controladores MVC
├── services/     # Reglas de negocio y transacciones
├── dto/          # Entrada y salida validadas
├── entities/     # Solo entidades propias del módulo
├── views/        # Vistas Handlebars propias, si aplica
└── nombre-modulo.module.ts
```

No importar repositorios de otro módulo para saltarse reglas de negocio. Un módulo expone servicios o contratos explícitos.

El repositorio ya contiene módulos funcionales con controladores, servicios, entidades y DTOs. La estructura anterior es una convención organizativa; varios módulos actuales mantienen el controlador y servicio junto al archivo `.module.ts`.

Legal, Trabajo Social y Guardería se registran mediante `DomainModule → FormulariosModule`; Evolución se registra directamente en `DomainModule`.

Legal tiene servicios y repositorios propios y publica un adaptador ORM para
su variante en el motor común de formularios. No importa el módulo heredado.
Trabajo Social, Guardería y Evolución todavía conservan el adaptador histórico
durante su migración; esa compatibilidad no es el patrón para módulos nuevos.
Los controladores son el inventario vigente de rutas; validar además con las
pruebas y una base preparada.
