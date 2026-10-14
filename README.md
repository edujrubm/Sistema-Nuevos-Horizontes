# Sistema Nuevos Horizontes

Repositorio de colaboración del equipo.

## Organización del trabajo

- `main` contiene los cambios integrados y revisados.
- Las ramas por área son `medicina`, `psicologia`, `legal`, `social`, `albergue`, `guarderia` y `administracion`.
- Cada equipo trabaja en la rama de su área y propone su integración en `main` mediante un Pull Request.
- Integrar los cambios mediante Pull Requests y revisión del equipo.
- Evitar subir contraseñas, credenciales, datos personales o entrevistas.

## Primeros pasos

```sh
git clone https://github.com/edujrubm/Sistema-Nuevos-Horizontes.git
cd Sistema-Nuevos-Horizontes
git fetch origin
git switch main
```

Para trabajar en un área, por ejemplo medicina:

```sh
git fetch origin
git switch medicina
git pull --ff-only origin medicina
```

Reemplazar `medicina` por la rama correspondiente. Antes de integrar cambios, revisar y resolver los posibles conflictos con `main`.

Cada integrante debe configurar su propio nombre y correo en Git antes de realizar commits.
