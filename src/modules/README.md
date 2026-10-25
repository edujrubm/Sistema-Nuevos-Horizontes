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

En esta fase los módulos contienen únicamente su archivo `.module.ts`. No se han definido rutas, controladores, servicios, entidades ni DTOs funcionales; esos elementos se agregarán después de aprobar los contratos de cada área.
