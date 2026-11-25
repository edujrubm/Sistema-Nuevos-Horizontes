const argon2 = require("argon2");
const { ErrorDemo, resolverPlan, huella } = require("./plan.cjs");
const {
  abrirCredenciales,
  guardarConfirmacion,
} = require("./credenciales.cjs");

/** Nunca adopta cuentas preexistentes ni cambia una contraseña al repetir un lote. */
async function comprobarExistentes(usuarios, plan, carpeta) {
  if (usuarios.length !== plan.length)
    throw new ErrorDemo(
      "Hay cuentas parciales o colisiones. No se modificó ninguna cuenta.",
    );
  for (const c of plan) {
    const u = usuarios.find((u) => u.nombre_usuario === c.usuario);
    const secreto = carpeta.data.cuentas.find((s) => s.usuario === c.usuario);
    if (
      !u?.activo ||
      u.empleado?.rol_id !== c.rolId ||
      u.empleado?.nombre !== c.nombre ||
      !(await argon2
        .verify(u.contrasena_hash, secreto.contrasena)
        .catch(() => false))
    )
      throw new ErrorDemo(
        "Una cuenta existente no coincide con el lote privado. No se modificó ninguna cuenta.",
      );
  }
}

/** Las credenciales se conservan antes del COMMIT para reconciliar una respuesta perdida. */
async function crearDemo(repo, config, opciones) {
  const destino = opciones.destino;
  if (opciones.confirmarBase !== destino.database)
    throw new ErrorDemo("Confirma el nombre exacto de DATABASE_NAME.");
  await repo.actor(opciones.actor);
  const plan = resolverPlan(config, await repo.catalogo());
  const existentes = await repo.existentes();
  if (existentes.length && existentes.length !== plan.length)
    throw new ErrorDemo(
      "Existen cuentas parciales o colisiones; no se permite sobrescribirlas.",
    );
  const fingerprint = huella(plan, destino);
  const carpeta = abrirCredenciales(opciones.salida, fingerprint, plan, {
    puedeCrear: !existentes.length,
    archivoPreparado: opciones.credenciales,
  });
  if (existentes.length) {
    await comprobarExistentes(existentes, plan, carpeta);
  } else {
    const hashes = Object.fromEntries(
      await Promise.all(
        carpeta.data.cuentas.map(async (c) => [
          c.usuario,
          await argon2.hash(c.contrasena, { type: argon2.argon2id }),
        ]),
      ),
    );
    await repo.transaccion(opciones.actor, async (manager) => {
      const vigente = resolverPlan(config, await repo.catalogo(manager));
      if (
        huella(vigente, destino) !== fingerprint ||
        JSON.stringify(vigente) !== JSON.stringify(plan)
      )
        throw new ErrorDemo(
          "Los roles o permisos cambiaron durante la operación. Revisa el catálogo.",
        );
      const concurrentes = await repo.existentes(manager);
      if (concurrentes.length)
        return comprobarExistentes(concurrentes, plan, carpeta);
      return repo.insertar(manager, plan, hashes);
    });
  }
  const confirmados = await repo.existentes();
  await comprobarExistentes(confirmados, plan, carpeta);
  const cuentas = plan.map((c) => {
    const u = confirmados.find((u) => u.nombre_usuario === c.usuario);
    return {
      usuario: c.usuario,
      contrasena: carpeta.data.cuentas.find((s) => s.usuario === c.usuario)
        .contrasena,
      usuarioId: u.id_usuario,
      perfil: c.perfil,
      area: c.area,
      rolId: c.rolId,
      permisos: c.permisos,
      cambioObligatorio: u.debe_cambiar_contrasena,
    };
  });
  guardarConfirmacion(carpeta, cuentas, destino);
  return {
    total: cuentas.length,
    credenciales: carpeta.archivo,
    repetido: existentes.length > 0,
  };
}
module.exports = { crearDemo, comprobarExistentes };
