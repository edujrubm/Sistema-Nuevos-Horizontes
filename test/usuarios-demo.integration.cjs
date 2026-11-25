const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { cuentas, resolverPlan } = require("../scripts/usuarios-demo/plan.cjs");
const {
  conexion,
  RepositorioDemo,
} = require("../scripts/usuarios-demo/repositorio.cjs");
const { crearDemo } = require("../scripts/usuarios-demo/servicio.cjs");
let data, repo, config, opciones, privado, previo, app, url;

// Sólo admite el clúster desechable del harness; nunca se ejecuta contra el proyecto.
before(async () => {
  assert.equal(process.env.NODE_ENV, "test");
  assert.match(process.env.DATABASE_NAME || "", /^legal_orm_test_[a-f0-9]{8}$/);
  assert.equal(process.env.DATABASE_HOST, "127.0.0.1");
  data = conexion(process.env, false);
  await data.initialize();
  repo = new RepositorioDemo(data);
  // Los roles sintéticos pertenecen exclusivamente al ensayo, no al inicializador entregado.
  const areas = [
    "Legal",
    "Trabajo Social",
    "Medicina",
    "Psicología",
    "Guardería",
    "Albergue",
  ];
  for (const nombre of areas)
    await data.query(
      `INSERT INTO new_horizons.area(nombre_area) SELECT $1::varchar WHERE NOT EXISTS(SELECT 1 FROM new_horizons.area WHERE nombre_area=$1::varchar)`,
      [nombre],
    );
  const catalogoAreas = await data.query(
    "SELECT id_area::text AS id,nombre_area AS nombre FROM new_horizons.area",
  );
  const [p] = await data.query(
    "INSERT INTO new_horizons.permisos(tipo_permisos) VALUES('crear') RETURNING id_permisos",
  );
  const [r] = await data.query(
    "INSERT INTO new_horizons.recursos(tipo_recursos) VALUES('usuarios') RETURNING id_recursos",
  );
  const [consulta] = await data.query(
    "INSERT INTO new_horizons.permisos(tipo_permisos) VALUES('consultar') RETURNING id_permisos",
  );
  const [expediente] = await data.query(
    "INSERT INTO new_horizons.recursos(tipo_recursos) VALUES('expedientes') RETURNING id_recursos",
  );
  await data.query(
    "SELECT setval(pg_get_serial_sequence('new_horizons.rol','id_rol'),(SELECT max(id_rol) FROM new_horizons.rol))",
  );
  config = { roles: {} };
  for (const c of cuentas) {
    const areaId = c.areas
      ? catalogoAreas.find((a) => a.nombre === c.areas[0]).id
      : null;
    const tipo =
      c.usuario === "demo.admin"
        ? "administrador_general"
        : "ensayo_" + c.usuario;
    const [rol] = await data.query(
      "INSERT INTO new_horizons.rol(tipo_rol,id_area) VALUES($1,$2) RETURNING id_rol::text AS id",
      [tipo, areaId],
    );
    await data.query(
      "INSERT INTO new_horizons.rol_permisos_por_recurso(id_rol,id_permisos,id_recursos) VALUES($1,$2,$3)",
      [
        rol.id,
        c.usuario === "demo.admin" ? p.id_permisos : consulta.id_permisos,
        c.usuario === "demo.admin" ? r.id_recursos : expediente.id_recursos,
      ],
    );
    config.roles[c.usuario] = {
      rolId: rol.id,
      tipoRolEsperado: tipo,
      areaIdEsperada: areaId,
    };
  }
  await data.query(
    "UPDATE new_horizons.empleado SET rol_id=$1 WHERE id_empleado=1",
    [config.roles["demo.admin"].rolId],
  );
  for (const table of ["empleado", "usuario"])
    await data.query(
      `SELECT setval(pg_get_serial_sequence('new_horizons.${table}','id_${table}'),(SELECT max(id_${table}) FROM new_horizons.${table}))`,
    );
  privado = fs.mkdtempSync(path.join(os.tmpdir(), "nh-demo-qa-"));
  const importacion = path.join(privado, "usuarios-demo-preparados.json");
  fs.writeFileSync(
    importacion,
    JSON.stringify({
      cuentas: cuentas.map((c) => ({
        usuario: c.usuario,
        contrasena: require("node:crypto")
          .randomBytes(18)
          .toString("base64url"),
      })),
    }),
  );
  opciones = {
    actor: "1",
    confirmarBase: process.env.DATABASE_NAME,
    salida: path.join(privado, "lote"),
    credenciales: importacion,
    destino: {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      database: process.env.DATABASE_NAME,
    },
  };
  previo = await snapshot();
});
after(async () => {
  if (app) await app.close();
  if (data?.isInitialized) await data.destroy();
});
async function snapshot() {
  return data.query(`SELECT 'roles' AS tipo,jsonb_agg(to_jsonb(t) ORDER BY id_rol) AS datos FROM new_horizons.rol t
    UNION ALL SELECT 'permisos',jsonb_agg(to_jsonb(t) ORDER BY id_permisos) FROM new_horizons.permisos t
    UNION ALL SELECT 'matriz',jsonb_agg(to_jsonb(t) ORDER BY id_rol,id_permisos,id_recursos) FROM new_horizons.rol_permisos_por_recurso t
    UNION ALL SELECT 'formularios',jsonb_agg(to_jsonb(t) ORDER BY id) FROM new_horizons.formulario_area t
    UNION ALL SELECT 'usuario_previo',jsonb_agg(to_jsonb(t)) FROM new_horizons.usuario t WHERE id_usuario=1
    UNION ALL SELECT 'empleado_previo',jsonb_agg(to_jsonb(t)) FROM new_horizons.empleado t WHERE id_empleado=1`);
}
test("La plantilla obliga a elegir roles reales; rechaza ID, área o tipo incorrectos", async () => {
  const catalogo = await repo.catalogo();
  assert.throws(() =>
    resolverPlan(
      require("../scripts/usuarios-demo/roles.example.json"),
      catalogo,
    ),
  );
  for (const cambio of [
    { rolId: "99999" },
    { tipoRolEsperado: "inventado" },
    { areaIdEsperada: "99999" },
  ]) {
    const invalido = structuredClone(config);
    Object.assign(invalido.roles["demo.legal"], cambio);
    assert.throws(() => resolverPlan(invalido, catalogo));
  }
  const invalido = structuredClone(config);
  invalido.roles["demo.legal"] = config.roles["demo.guarderia"];
  assert.throws(() => resolverPlan(invalido, catalogo));
});
test("Precondiciones fallidas y carpetas Git no crean usuarios", async () => {
  assert.throws(() =>
    conexion({ ...process.env, NODE_ENV: "production" }, false),
  );
  for (const extra of [
    { confirmarBase: "otra_base" },
    { actor: "999999" },
    { salida: path.resolve("credenciales-no-permitidas") },
  ])
    await assert.rejects(crearDemo(repo, config, { ...opciones, ...extra }));
  assert.equal((await repo.existentes()).length, 0);
});
test("Rechaza importaciones incompletas sin crear usuarios", async () => {
  const archivo = path.join(privado, "incompleto.json");
  fs.writeFileSync(
    archivo,
    JSON.stringify({
      cuentas: [{ usuario: "demo.admin", contrasena: "invalida" }],
    }),
  );
  await assert.rejects(
    crearDemo(repo, config, { ...opciones, credenciales: archivo }),
  );
  assert.equal((await repo.existentes()).length, 0);
});
test("Un fallo a mitad del lote revierte usuarios, empleados y auditoría", async () => {
  const original = repo.insertar.bind(repo);
  const [antes] = await data.query(
    "SELECT count(*)::int AS total FROM new_horizons.empleado",
  );
  repo.insertar = async (manager, plan, hashes) => {
    await original(manager, plan.slice(0, 1), hashes);
    throw new Error("Fallo simulado");
  };
  try {
    await assert.rejects(crearDemo(repo, config, opciones));
  } finally {
    repo.insertar = original;
  }
  assert.equal((await repo.existentes()).length, 0);
  const [despues] = await data.query(
    "SELECT count(*)::int AS total FROM new_horizons.empleado",
  );
  assert.equal(despues.total, antes.total);
  const [auditoria] = await data.query(
    "SELECT count(*)::int AS total FROM new_horizons.revision_registro WHERE tabla='usuario' AND nuevo->>'nombre_usuario' LIKE 'demo.%'",
  );
  assert.equal(auditoria.total, 0);
});
test("Crea once cuentas con ORM, Argon2id y auditoría sin generar PDF", async () => {
  const paralelo = {
    ...opciones,
    salida: path.join(privado, "lote-concurrente"),
    credenciales: undefined,
  };
  const intentos = await Promise.allSettled([
    crearDemo(repo, config, opciones),
    crearDemo(repo, config, paralelo),
  ]);
  assert.equal(intentos.filter((i) => i.status === "fulfilled").length, 1);
  const ganador = intentos.findIndex((i) => i.status === "fulfilled");
  if (ganador === 1) opciones = paralelo;
  const r = intentos[ganador].value;
  assert.equal(r.total, 11);
  assert.equal(r.repetido, false);
  const usuarios = await repo.existentes();
  assert.equal(usuarios.length, 11);
  assert.ok(usuarios.every((u) => u.contrasena_hash.startsWith("$argon2id$")));
  const lote = JSON.parse(
    fs.readFileSync(
      path.join(opciones.salida, "credenciales-demo.json"),
      "utf8",
    ),
  );
  assert.equal(lote.estado, "CONFIRMADO");
  assert.equal(new Set(lote.cuentas.map((c) => c.contrasena)).size, 11);
  assert.equal(
    r.credenciales,
    path.join(opciones.salida, "credenciales-demo.json"),
  );
  assert.equal(Object.hasOwn(r, "pdf"), false);
  assert.equal(
    fs.readdirSync(opciones.salida).some((f) => f.endsWith(".pdf")),
    false,
  );
  if (ganador === 0) {
    const preparadas = JSON.parse(
      fs.readFileSync(opciones.credenciales, "utf8"),
    );
    assert.ok(
      lote.cuentas.every((c) =>
        preparadas.cuentas.some(
          (p) => p.usuario === c.usuario && p.contrasena === c.contrasena,
        ),
      ),
    );
  }
  const registros = await data.query(
    "SELECT actor_id::text,anterior,nuevo FROM new_horizons.revision_registro WHERE tabla='usuario' AND nuevo->>'nombre_usuario' LIKE 'demo.%'",
  );
  assert.equal(registros.length, 11);
  assert.ok(registros.every((r) => r.actor_id === "1" && r.anterior === null));
  assert.ok(registros.every((r) => !JSON.stringify(r).includes("contrasena")));
  assert.deepEqual(await snapshot(), previo);
});
test("Reconcilia un lote pendiente sin reescribir usuarios y rechaza otro destino", async () => {
  const archivo = path.join(opciones.salida, "credenciales-demo.json");
  const lote = JSON.parse(fs.readFileSync(archivo, "utf8"));
  const antes = await repo.existentes();
  fs.writeFileSync(archivo, JSON.stringify({ ...lote, estado: "PENDIENTE" }));
  const r = await crearDemo(repo, config, opciones);
  assert.equal(r.repetido, true);
  assert.equal(
    JSON.parse(fs.readFileSync(archivo, "utf8")).estado,
    "CONFIRMADO",
  );
  assert.deepEqual(await repo.existentes(), antes);
  await assert.rejects(
    crearDemo(repo, config, {
      ...opciones,
      destino: { ...opciones.destino, host: "otro-destino" },
    }),
  );
});
test("Repetición y dos ejecuciones simultáneas conservan ID, contraseñas y permisos", async () => {
  const antes = await repo.existentes();
  const resultados = await Promise.all([
    crearDemo(repo, config, opciones),
    crearDemo(repo, config, opciones),
  ]);
  assert.ok(resultados.every((r) => r.repetido));
  assert.deepEqual(await repo.existentes(), antes);
  await assert.rejects(
    crearDemo(repo, config, {
      ...opciones,
      salida: path.join(privado, "otra"),
    }),
  );
});
test("Rechaza un lote ajeno, cuentas parciales y errores de CLI sin exponer secretos", async () => {
  const original = repo.existentes.bind(repo);
  repo.existentes = async () => (await original()).slice(0, 1);
  try {
    await assert.rejects(crearDemo(repo, config, opciones));
  } finally {
    repo.existentes = original;
  }
  const archivo = path.join(privado, "roles.json");
  fs.writeFileSync(archivo, JSON.stringify(config));
  const r = spawnSync(
    process.execPath,
    ["scripts/usuarios-demo.cjs", "verificar", "--roles", archivo],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).existentes, 11);
  const rechazado = spawnSync(
    process.execPath,
    [
      "scripts/usuarios-demo.cjs",
      "crear",
      "--roles",
      archivo,
      "--actor",
      "1",
      "--confirmar-base",
      "incorrecta",
      "--salida",
      opciones.salida,
    ],
    { encoding: "utf8" },
  );
  assert.equal(rechazado.status, 1);
  const lote = JSON.parse(
    fs.readFileSync(
      path.join(opciones.salida, "credenciales-demo.json"),
      "utf8",
    ),
  );
  assert.ok(
    lote.cuentas.every(
      (c) =>
        !r.stdout.includes(c.contrasena) &&
        !rechazado.stderr.includes(c.contrasena),
    ),
  );
});
test("Las once cuentas inician sesión y consultan perfil mediante la API real", async () => {
  const { NestFactory } = require("@nestjs/core");
  app = await NestFactory.create(require("../dist/app.module").AppModule, {
    logger: false,
  });
  require("../dist/common/errors/transporte").configurarTransporteApi(app);
  app.setGlobalPrefix("api");
  await app.listen(0, "127.0.0.1");
  url = (await app.getUrl()) + "/api/seguridad";
  const lote = JSON.parse(
    fs.readFileSync(
      path.join(opciones.salida, "credenciales-demo.json"),
      "utf8",
    ),
  );
  for (const c of lote.cuentas) {
    const r = await fetch(url + "/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nombre_usuario: c.usuario,
        contrasena: c.contrasena,
      }),
    });
    assert.equal(r.status, 200, `Login rechazado: ${c.usuario}`);
    const login = await r.json();
    assert.equal(login.usuario.rol.id_rol, c.rolId);
    const headers = { authorization: "Bearer " + login.access_token };
    const perfil = await fetch(url + "/perfil", { headers });
    assert.equal(perfil.status, 200);
    const alta = await fetch(url + "/usuarios", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(
      alta.status,
      c.usuario === "demo.admin" ? 400 : 403,
      "La API debe conservar su comprobación de permisos de administración",
    );
    const logout = await fetch(url + "/logout", { method: "POST", headers });
    assert.equal(logout.status, 200);
    assert.equal((await fetch(url + "/perfil", { headers })).status, 401);
  }
  const r = await fetch(url + "/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      nombre_usuario: "demo.legal",
      contrasena: "incorrecta",
    }),
  });
  assert.equal(r.status, 401);
  assert.deepEqual(await snapshot(), previo);
});
