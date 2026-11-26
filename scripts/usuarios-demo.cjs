#!/usr/bin/env node
const fs = require("node:fs");
const { ErrorDemo, resolverPlan } = require("./usuarios-demo/plan.cjs");

/** Inicializador manual. No se incorpora al arranque, despliegue ni migraciones. */
async function main() {
  const [comando, ...args] = process.argv.slice(2);
  if (!["catalogo", "verificar", "crear"].includes(comando))
    throw new ErrorDemo(
      "Uso: usuarios-demo.cjs catalogo | verificar --roles archivo.json | crear --roles archivo.json --actor ID --confirmar-base BASE --salida CARPETA_PRIVADA [--credenciales ARCHIVO_PRIVADO]",
    );
  const opciones = {};
  for (let i = 0; i < args.length; i += 2) {
    if (
      ![
        "--roles",
        "--actor",
        "--confirmar-base",
        "--salida",
        "--credenciales",
      ].includes(args[i]) ||
      !args[i + 1] ||
      opciones[args[i]]
    )
      throw new ErrorDemo("Argumentos inválidos o repetidos.");
    opciones[args[i]] = args[i + 1];
  }
  if (comando !== "catalogo" && !opciones["--roles"])
    throw new ErrorDemo("Falta --roles.");
  if (
    comando === "crear" &&
    ["--actor", "--confirmar-base", "--salida"].some((k) => !opciones[k])
  )
    throw new ErrorDemo("Falta --actor, --confirmar-base o --salida.");
  const {
    conexion,
    RepositorioDemo,
  } = require("./usuarios-demo/repositorio.cjs");
  const data = conexion(process.env, comando !== "crear");
  try {
    await data.initialize();
    const repo = new RepositorioDemo(data);
    if (comando === "catalogo")
      return console.log(JSON.stringify(await repo.catalogo(), null, 2));
    let config;
    try {
      config = JSON.parse(
        fs.readFileSync(opciones["--roles"], "utf8").replace(/^\uFEFF/, ""),
      );
    } catch {
      throw new ErrorDemo("No se pudo leer el archivo de asignación de roles.");
    }
    if (comando === "verificar") {
      const plan = resolverPlan(config, await repo.catalogo());
      return console.log(
        JSON.stringify(
          {
            base: process.env.DATABASE_NAME,
            cuentas: plan.map((c) => ({
              usuario: c.usuario,
              rolId: c.rolId,
              area: c.area,
            })),
            existentes: (await repo.existentes()).length,
          },
          null,
          2,
        ),
      );
    }
    const { crearDemo } = require("./usuarios-demo/servicio.cjs");
    const resultado = await crearDemo(repo, config, {
      destino: {
        host: process.env.DATABASE_HOST,
        port: String(process.env.DATABASE_PORT || 5432),
        database: process.env.DATABASE_NAME,
      },
      actor: opciones["--actor"],
      confirmarBase: opciones["--confirmar-base"],
      salida: opciones["--salida"],
      credenciales: opciones["--credenciales"],
    });
    console.log(JSON.stringify(resultado, null, 2));
  } finally {
    if (data.isInitialized) await data.destroy();
  }
}
main().catch((error) => {
  // Los errores del driver pueden incluir datos personales o secretos: nunca imprimirlos.
  console.error(
    error instanceof ErrorDemo
      ? error.message
      : "No se completó la operación. Conserva la carpeta privada y solicita revisión técnica; no se imprimieron datos sensibles.",
  );
  process.exitCode = 1;
});
