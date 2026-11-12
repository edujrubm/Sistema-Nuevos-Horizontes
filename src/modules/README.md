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

Legal, Trabajo Social y Guardería se registran mediante `DomainModule → FormulariosModule`; Evolución se registra directamente en `DomainModule`. La lógica común de estas áreas se expone mediante `Persona3CoreModule`. Consultar el [inventario de rutas de Persona 3](../../docs/integracion/RUTAS_PERSONA3_MAIN_20261112.md).
