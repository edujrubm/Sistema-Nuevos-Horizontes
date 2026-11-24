const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

/** Verifica archivos y equivalencias; nunca conecta a PostgreSQL ni ejecuta SQL. */
function verificar(root, registro) {
  const dir = path.join(root, "database/migrations");
  const { migraciones } = JSON.parse(
    fs.readFileSync(path.join(dir, "manifest.json"), "utf8"),
  );
  const archivos = fs
    .readdirSync(dir)
    .filter((nombre) => nombre.endsWith(".sql"))
    .sort();
  if (
    JSON.stringify(archivos) !==
    JSON.stringify(migraciones.map((m) => m.archivo))
  ) {
    throw new Error("El inventario SQL no coincide con el manifiesto.");
  }
  const equivalencias = new Map();
  for (const [indice, migracion] of migraciones.entries()) {
    if (
      !migracion.archivo.startsWith(String(indice + 3).padStart(3, "0") + "_")
    ) {
      throw new Error("La numeración debe ser única y consecutiva desde 003.");
    }
    const hash = createHash("sha256")
      .update(fs.readFileSync(path.join(dir, migracion.archivo)))
      .digest("hex");
    if (hash !== migracion.sha256)
      throw new Error(`Contenido modificado: ${migracion.archivo}`);
    for (const identidad of [
      { archivo: migracion.archivo, sha256: hash },
      ...migracion.antecedentes,
    ]) {
      if (equivalencias.has(identidad.archivo))
        throw new Error("Nombre ambiguo en las equivalencias.");
      equivalencias.set(identidad.archivo, {
        actual: migracion.archivo,
        sha256: identidad.sha256,
      });
    }
  }
  if (registro === undefined)
    return {
      inventarioValido: true,
      total: migraciones.length,
      estadoBD: "NO_VERIFICADO",
    };
  return compararRegistro(migraciones, equivalencias, registro);
}

/** Reconoce nombres anteriores sin convertirlos en una ejecución pendiente. */
function compararRegistro(migraciones, equivalencias, registro) {
  if (!registro || !Array.isArray(registro.aplicadas))
    throw new Error(
      "El registro debe contener aplicadas: [{archivo, sha256}].",
    );
  const aplicadas = new Set();
  for (const entrada of registro.aplicadas) {
    if (
      !entrada ||
      typeof entrada.archivo !== "string" ||
      typeof entrada.sha256 !== "string"
    )
      throw new Error("Cada entrada requiere archivo y sha256 como texto.");
    const identidad = equivalencias.get(entrada.archivo);
    if (!identidad || identidad.sha256 !== entrada.sha256?.toLowerCase()) {
      throw new Error(`Nombre o hash no reconocido: ${entrada.archivo}`);
    }
    if (aplicadas.has(identidad.actual))
      throw new Error(
        `Registro duplicado o renombre reaplicado: ${identidad.actual}`,
      );
    aplicadas.add(identidad.actual);
  }
  // Es una comparación con el registro entregado, no certifica objetos ni dependencias de la BD.
  return {
    inventarioValido: true,
    total: migraciones.length,
    estadoBD: "REGISTRO_APORTADO",
    reconocidas: [...aplicadas],
    porRevisar: migraciones
      .map((m) => m.archivo)
      .filter((nombre) => !aplicadas.has(nombre)),
  };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== "--aplicadas"))
      throw new Error(
        "Uso: node scripts/verificar-migraciones.cjs [--aplicadas registro.json]",
      );
    const registro = args.length
      ? JSON.parse(fs.readFileSync(args[1], "utf8"))
      : undefined;
    console.log(
      JSON.stringify(
        verificar(path.resolve(__dirname, ".."), registro),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { verificar };
