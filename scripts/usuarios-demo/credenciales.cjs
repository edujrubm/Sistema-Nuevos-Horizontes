const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { randomBytes, randomUUID } = require("node:crypto");
const { ErrorDemo } = require("./plan.cjs");

function destinoPrivado(dir) {
  const abs = path.resolve(dir),
    parent = fs.realpathSync(path.dirname(abs));
  if (path.join(parent, path.basename(abs)).toLowerCase() !== abs.toLowerCase())
    throw new ErrorDemo("Utiliza una carpeta privada sin enlaces simbólicos.");
  try {
    execFileSync("git", ["-C", parent, "rev-parse", "--git-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    throw new ErrorDemo(
      "La carpeta de contraseñas debe estar fuera de cualquier repositorio Git.",
    );
  } catch (error) {
    if (error instanceof ErrorDemo) throw error;
    if (error.status !== 128)
      throw new ErrorDemo("No se pudo verificar la ubicación privada.");
  }
  if (fs.existsSync(abs) && fs.lstatSync(abs).isSymbolicLink())
    throw new ErrorDemo("La carpeta privada no puede ser un enlace.");
  return abs;
}
function protegerCarpeta(dir) {
  if (process.platform === "win32") {
    const salida = execFileSync("whoami", ["/user", "/fo", "csv", "/nh"], {
      encoding: "utf8",
    });
    const sid = salida.match(/S-\d+(?:-\d+)+/)?.[0];
    if (!sid)
      throw new ErrorDemo(
        "No se pudo identificar al propietario de la carpeta privada.",
      );
    execFileSync(
      "icacls",
      [dir, "/inheritance:r", "/grant:r", `*${sid}:(OI)(CI)F`],
      { stdio: "pipe" },
    );
  } else fs.chmodSync(dir, 0o700);
}
/** Importa sólo las once claves preparadas fuera de Git; no acepta cuentas adicionales. */
function leerPreparadas(archivo, plan) {
  if (!archivo) return null;
  const data = JSON.parse(
    fs.readFileSync(destinoPrivado(archivo), "utf8").replace(/^\uFEFF/, ""),
  );
  if (
    !Array.isArray(data.cuentas) ||
    data.cuentas.length !== plan.length ||
    new Set(data.cuentas.map((c) => c.contrasena)).size !== plan.length ||
    plan.some(
      (c) =>
        !data.cuentas.some(
          (s) =>
            s.usuario === c.usuario &&
            typeof s.contrasena === "string" &&
            /^[A-Za-z0-9_-]{24}$/.test(s.contrasena),
        ),
    )
  )
    throw new ErrorDemo(
      "El archivo privado debe contener las once cuentas aprobadas y claves distintas de 24 caracteres.",
    );
  return plan.map((c) => ({
    usuario: c.usuario,
    contrasena: data.cuentas.find((s) => s.usuario === c.usuario).contrasena,
  }));
}
/** Guarda el secreto antes del COMMIT para poder reconciliar una respuesta perdida. */
function abrirCredenciales(dir, fingerprint, plan, opciones) {
  const preparadas = leerPreparadas(opciones.archivoPreparado, plan);
  dir = destinoPrivado(dir);
  const archivo = path.join(dir, "credenciales-demo.json");
  if (fs.existsSync(dir)) {
    if (!fs.existsSync(archivo) || fs.lstatSync(archivo).isSymbolicLink())
      throw new ErrorDemo(
        "La carpeta existente no contiene un lote válido. Elige otra ubicación.",
      );
    const data = JSON.parse(fs.readFileSync(archivo, "utf8"));
    if (
      data.huella !== fingerprint ||
      !Array.isArray(data.cuentas) ||
      data.cuentas.length !== plan.length ||
      plan.some(
        (c) =>
          !data.cuentas.some(
            (x) =>
              x.usuario === c.usuario &&
              typeof x.contrasena === "string" &&
              /^[A-Za-z0-9_-]{24}$/.test(x.contrasena),
          ),
      )
    )
      throw new ErrorDemo(
        "La carpeta privada pertenece a otro destino o asignación.",
      );
    if (
      preparadas &&
      preparadas.some(
        (c) =>
          data.cuentas.find((s) => s.usuario === c.usuario).contrasena !==
          c.contrasena,
      )
    )
      throw new ErrorDemo(
        "Las claves preparadas no coinciden con el lote original; no se cambiarán contraseñas.",
      );
    return { dir, archivo, data };
  }
  if (!opciones.puedeCrear)
    throw new ErrorDemo(
      "Las cuentas ya existen. Se necesita su carpeta original; no se recuperan ni cambian contraseñas.",
    );
  fs.mkdirSync(dir, { mode: 0o700 });
  protegerCarpeta(dir);
  const data = {
    estado: "PENDIENTE",
    huella: fingerprint,
    lote: randomUUID(),
    generadoEn: new Date().toISOString(),
    cuentas:
      preparadas ||
      plan.map((c) => ({
        usuario: c.usuario,
        contrasena: randomBytes(18).toString("base64url"),
      })),
  };
  fs.writeFileSync(archivo, JSON.stringify(data, null, 2), {
    flag: "wx",
    mode: 0o600,
  });
  return { dir, archivo, data };
}
function guardarConfirmacion(carpeta, cuentas, destino) {
  carpeta.data = {
    ...carpeta.data,
    estado: "CONFIRMADO",
    destino,
    confirmadoEn: new Date().toISOString(),
    cuentas,
  };
  const temp = path.join(carpeta.dir, `confirmacion-${randomUUID()}.json`);
  fs.writeFileSync(temp, JSON.stringify(carpeta.data, null, 2), {
    flag: "wx",
    mode: 0o600,
  });
  fs.renameSync(temp, carpeta.archivo);
}
module.exports = { destinoPrivado, abrirCredenciales, guardarConfirmacion };
