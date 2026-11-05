# Guía rápida de la estructura de Git

## 1. ¿Qué contiene el repositorio?

El repositorio corresponde al sistema institucional **Nuevos Horizontes**. Actualmente contiene la base del backend en NestJS, la estructura modular, la documentación técnica y la organización inicial de la base de datos.

```text
Sistema-Nuevos-Horizontes/
├── src/                         # Código del backend NestJS
│   ├── common/                  # Elementos compartidos
│   ├── database/                # Configuración de acceso a PostgreSQL
│   └── modules/                 # Módulos organizados por dominio
├── database/                    # Scripts y migraciones SQL
├── docs/                        # Documentación del proyecto
├── .github/                     # Plantillas y automatizaciones de GitHub
├── package.json                 # Dependencias y comandos del proyecto
└── README.md                    # Introducción general
```

## 2. Estructura de módulos

Cada módulo representa un área del sistema y mantiene la misma organización interna:

```text
src/modules/beneficiarias/
├── beneficiarias.module.ts       # Configuración del módulo
├── beneficiarias.controller.ts   # Entrada futura de solicitudes HTTP
├── beneficiarias.service.ts      # Reglas de negocio futuras
├── entities/                     # Entidades TypeORM
├── dto/                          # Objetos de entrada y validación
└── repositories/                 # Acceso organizado a datos
```

Los controladores y servicios preparados actualmente son estructura, no funcionalidad terminada. Las rutas se implementarán posteriormente.

## 3. Módulos principales

```text
modules/
├── beneficiarias/                # Identidad maestra
├── expedientes/                  # Expediente permanente
├── ficha-inicial/                # Ficha inicial
├── formularios/                  # Atención por área
│   ├── psicologia/
│   ├── medicina/
│   ├── social/
│   ├── legal/
│   └── guarderia/
├── ninos/                        # Información de niñas y niños
├── albergue/                     # Movimientos y albergue
├── documentos/                   # Documentos institucionales
├── seguridad/                    # Acceso y permisos
├── auditoria/                    # Trazabilidad
├── administracion/               # Configuración administrativa
└── reportes/                     # Consultas y reportes
```

## 4. Branches

Las branches permiten trabajar sin afectar directamente la versión estable:

```text
main
├── infraestructura/nestjs-bootstrap  # Base inicial del backend
├── administracion                    # Trabajo del área administrativa
├── albergue                          # Trabajo del área de albergue
├── guarderia                         # Trabajo de guardería
├── legal                             # Trabajo del área legal
├── medicina                          # Trabajo del área médica
├── psicologia                        # Trabajo del área psicológica
├── social                            # Trabajo de trabajo social
└── docs/documentacion-completa       # Documentación y estructura actual
```

La branch `main` es la referencia común. Cada integrante trabaja en la branch de su área y propone sus cambios mediante un Pull Request.

## 5. Flujo recomendado de trabajo

```text
1. Actualizar main
        ↓
2. Cambiar a la branch del área
        ↓
3. Crear una branch de trabajo si es necesario
        ↓
4. Realizar cambios pequeños y relacionados
        ↓
5. Probar localmente
        ↓
6. Hacer commit con un mensaje claro
        ↓
7. Subir la branch y abrir Pull Request
        ↓
8. Revisar y fusionar a main
```

Comandos básicos:

```bash
git switch main
git pull origin main
git switch nombre-de-la-branch
git status
git add .
git commit -m "tipo: descripción breve del cambio"
git push -u origin nombre-de-la-branch
```

## 6. Convención de commits

Se recomienda usar mensajes cortos y descriptivos:

```text
feat: nueva funcionalidad
fix: corrección de un error
docs: actualización de documentación
chore: cambio de estructura o configuración
refactor: reorganización sin cambiar el comportamiento
test: pruebas
```

## 7. Reglas importantes

- No trabajar directamente sobre `main` salvo para integraciones autorizadas.
- No subir contraseñas, archivos `.env` ni datos reales de beneficiarias.
- No modificar una migración SQL que ya fue ejecutada; crear una nueva.
- Mantener la documentación actualizada junto con los cambios importantes.
- Un Pull Request debe explicar qué cambió y cómo se verificó.
- Los controladores, servicios y entidades se implementarán por etapas; por ahora la estructura está preparada.

## 8. Estado actual

La base del repositorio está preparada para comenzar el desarrollo por módulos. La estructura, la documentación de backend/frontend, la organización de la base de datos y las carpetas de cada dominio ya están disponibles. El siguiente paso será implementar el primer módulo funcional siguiendo esta organización.
