const { createHash } = require("node:crypto");

const cuentas = [
  ["demo.admin", "Administración general", null],
  ["demo.direccion", "Directora", null],
  ["demo.admision", "Digitalizador de ficha inicial", null],
  ["demo.legal", "Coordinación de Legal", ["Legal"]],
  [
    "demo.social",
    "Coordinación de Trabajo Social",
    ["Trabajo Social", "Social"],
  ],
  ["demo.medicina", "Coordinación de Medicina", ["Medicina", "Médica"]],
  ["demo.psicologia", "Coordinación de Psicología", ["Psicología"]],
  ["demo.guarderia", "Coordinación de Guardería", ["Guardería"]],
  ["demo.albergue", "Coordinación de Albergue", ["Albergue"]],
  ["demo.captura.legal", "Digitalizador de Legal", ["Legal"]],
  ["demo.apoyo.guarderia", "Trabajadora de Guardería", ["Guardería"]],
].map(([usuario, perfil, areas]) => ({
  usuario,
  perfil,
  areas,
  nombre: `Demo - ${perfil}`,
}));

class ErrorDemo extends Error {}
function id(valor) {
  return (
    typeof valor === "string" &&
    /^[1-9]\d{0,18}$/.test(valor) &&
    BigInt(valor) <= 9223372036854775807n
  );
}
function normalizar(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Los ID y códigos se copian del catálogo real; nunca se crean roles ni permisos. */
function resolverPlan(config, catalogo) {
  if (
    !config?.roles ||
    Object.keys(config.roles).sort().join("|") !==
      cuentas
        .map((c) => c.usuario)
        .sort()
        .join("|")
  )
    throw new ErrorDemo(
      "La asignación debe incluir exactamente las once cuentas aprobadas.",
    );
  return cuentas.map((c) => {
    const m = config.roles[c.usuario];
    if (
      !m ||
      !id(m.rolId) ||
      typeof m.tipoRolEsperado !== "string" ||
      !m.tipoRolEsperado.trim() ||
      !Object.hasOwn(m, "areaIdEsperada") ||
      (m.areaIdEsperada !== null && !id(m.areaIdEsperada))
    )
      throw new ErrorDemo(
        `Completa rolId, tipoRolEsperado y areaIdEsperada para ${c.usuario}.`,
      );
    const r = catalogo.find((r) => r.id === m.rolId);
    if (!r || r.tipo !== m.tipoRolEsperado || r.areaId !== m.areaIdEsperada)
      throw new ErrorDemo(
        `La asignación no coincide con el catálogo: ${c.usuario}.`,
      );
    if (!r.permisos.length)
      throw new ErrorDemo(
        `El rol de ${c.usuario} no tiene permisos configurados.`,
      );
    if ((c.usuario === "demo.admin") !== (r.tipo === "administrador_general"))
      throw new ErrorDemo(
        "Sólo demo.admin puede recibir el rol administrador_general.",
      );
    if (
      c.areas &&
      (!r.area || !c.areas.some((a) => normalizar(a) === normalizar(r.area)))
    )
      throw new ErrorDemo(`El área asignada no corresponde a ${c.usuario}.`);
    return {
      ...c,
      rolId: r.id,
      tipoRol: r.tipo,
      areaId: r.areaId,
      area: r.area,
      permisos: r.permisos,
    };
  });
}
function huella(plan, destino) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        destino,
        roles: plan.map((c) => [
          c.usuario,
          c.rolId,
          c.tipoRol,
          c.areaId,
          c.permisos,
        ]),
      }),
    )
    .digest("hex");
}
module.exports = { cuentas, ErrorDemo, id, resolverPlan, huella };
