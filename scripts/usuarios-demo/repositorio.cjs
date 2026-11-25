require("reflect-metadata");
const { DataSource, ILike, In } = require("typeorm");
const {
  Usuario,
} = require("../../dist/modules/seguridad/entities/usuario.entity");
const {
  Empleado,
} = require("../../dist/modules/seguridad/entities/empleado.entity");
const { Rol } = require("../../dist/modules/seguridad/entities/rol.entity");
const { cuentas, ErrorDemo, id } = require("./plan.cjs");

function conexion(env, lectura) {
  for (const key of [
    "DATABASE_HOST",
    "DATABASE_NAME",
    "DATABASE_USER",
    "DATABASE_PASSWORD",
  ])
    if (!env[key]) throw new ErrorDemo(`Falta configurar ${key}.`);
  if (!["development", "test"].includes(env.NODE_ENV))
    throw new ErrorDemo("Este inicializador sólo admite development o test.");
  return new DataSource({
    type: "postgres",
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT || 5432),
    database: env.DATABASE_NAME,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    schema: "new_horizons",
    entities: [Usuario, Empleado, Rol],
    synchronize: false,
    migrationsRun: false,
    logging: false,
    ssl:
      env.DATABASE_SSL === "true"
        ? {
            rejectUnauthorized:
              env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
          }
        : false,
    extra: {
      connectionTimeoutMillis: 5000,
      options: lectura ? "-c default_transaction_read_only=on" : "",
    },
  });
}

/** CRUD con las entidades de Seguridad; SQL limitado a proyecciones y contexto transaccional. */
class RepositorioDemo {
  constructor(data) {
    this.data = data;
  }
  async catalogo(manager = this.data.manager) {
    // Proyección de cuatro tablas: no duplica ni modifica la matriz de permisos.
    return manager.query(`SELECT r.id_rol::text AS id,r.tipo_rol AS tipo,r.id_area::text AS "areaId",a.nombre_area AS area,
      COALESCE(array_agg(DISTINCT p.tipo_permisos||':'||rec.tipo_recursos ORDER BY p.tipo_permisos||':'||rec.tipo_recursos)
      FILTER(WHERE p.id_permisos IS NOT NULL AND rec.id_recursos IS NOT NULL),'{}'::text[]) AS permisos
      FROM new_horizons.rol r LEFT JOIN new_horizons.area a ON a.id_area=r.id_area
      LEFT JOIN new_horizons.rol_permisos_por_recurso rp ON rp.id_rol=r.id_rol
      LEFT JOIN new_horizons.permisos p ON p.id_permisos=rp.id_permisos
      LEFT JOIN new_horizons.recursos rec ON rec.id_recursos=rp.id_recursos
      GROUP BY r.id_rol,a.nombre_area ORDER BY r.id_rol`);
  }
  async actor(actorId, manager = this.data.manager) {
    if (!id(actorId))
      throw new ErrorDemo(
        "Indica el ID de una cuenta administradora existente.",
      );
    const u = await manager
      .getRepository(Usuario)
      .findOneBy({ id_usuario: actorId, activo: true });
    const e =
      u &&
      (await manager
        .getRepository(Empleado)
        .findOneBy({ id_empleado: u.id_empleado }));
    const r =
      e && (await this.catalogo(manager)).find((r) => r.id === e.rol_id);
    if (
      !r ||
      r.tipo !== "administrador_general" ||
      !r.permisos.includes("crear:usuarios")
    )
      throw new ErrorDemo(
        "El actor debe ser administrador activo con permiso crear:usuarios.",
      );
  }
  async existentes(manager = this.data.manager) {
    const usuarios = await manager
      .getRepository(Usuario)
      .find({
        where: cuentas.map((c) => ({ nombre_usuario: ILike(c.usuario) })),
      });
    if (!usuarios.length) return [];
    const empleados = await manager
      .getRepository(Empleado)
      .findBy({ id_empleado: In(usuarios.map((u) => u.id_empleado)) });
    return usuarios.map((u) => ({
      ...u,
      empleado: empleados.find((e) => e.id_empleado === u.id_empleado),
    }));
  }
  async insertar(manager, plan, hashes) {
    const result = [];
    for (const c of plan) {
      const e = await manager
        .getRepository(Empleado)
        .save({ nombre: c.nombre, cui: null, rol_id: c.rolId });
      // Se conserva el valor por defecto institucional de debe_cambiar_contrasena.
      const u = await manager
        .getRepository(Usuario)
        .save({
          nombre_usuario: c.usuario,
          contrasena_hash: hashes[c.usuario],
          id_empleado: e.id_empleado,
          activo: true,
        });
      result.push(u);
    }
    return result;
  }
  async transaccion(actorId, fn) {
    const runner = this.data.createQueryRunner();
    let commitIntentado = false;
    try {
      await runner.connect();
      await runner.startTransaction("SERIALIZABLE");
      await runner.manager.query(
        "SELECT set_config('lock_timeout','5000',true)",
      );
      // Serializa este inicializador y evita colisiones con altas concurrentes de la API.
      await runner.manager.query(
        "LOCK TABLE new_horizons.usuario,new_horizons.empleado IN SHARE ROW EXCLUSIVE MODE",
      );
      await this.actor(actorId, runner.manager);
      await runner.manager.query(
        "SELECT set_config('new_horizons.actor_id',$1,true),set_config('new_horizons.motivo',$2,true)",
        [actorId, "Creación autorizada de usuarios ficticios de demostración"],
      );
      const result = await fn(runner.manager);
      commitIntentado = true;
      await runner.commitTransaction();
      return result;
    } catch (error) {
      let rollback = true;
      if (runner.isTransactionActive)
        try {
          await runner.rollbackTransaction();
        } catch {
          rollback = false;
        }
      if (commitIntentado || !rollback)
        throw new ErrorDemo(
          "Resultado incierto: conserva la carpeta privada y verifica las cuentas antes de repetir.",
        );
      throw error;
    } finally {
      await runner.release();
    }
  }
}
module.exports = { conexion, RepositorioDemo };
