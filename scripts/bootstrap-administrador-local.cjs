const argon2 = require("argon2");
const { Client } = require("pg");

const USERNAME = "administrador";
const EMPLOYEE_NAME = "Administrador del sistema";
const ADMIN_ROLE = "administrador_general";

function databaseConfig() {
  return {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,
  };
}

async function main() {
  const password = process.env.NH_ADMIN_PASSWORD;
  if (!password || password.length < 12 || password.length > 128)
    throw new Error(
      "La contraseña temporal debe tener entre 12 y 128 caracteres.",
    );

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const client = new Client(databaseConfig());
  await client.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id_usuario::text
       FROM new_horizons.usuario
       WHERE lower(nombre_usuario)=lower($1)
       LIMIT 1`,
      [USERNAME],
    );
    if (existing.rowCount)
      throw new Error(
        "El usuario administrador ya existe; no se modificó su contraseña.",
      );

    const roleResult = await client.query(
      `SELECT r.id_rol::text,
              count(rp.id_rol)::integer AS permisos
       FROM new_horizons.rol r
       LEFT JOIN new_horizons.rol_permisos_por_recurso rp
         ON rp.id_rol=r.id_rol
       WHERE r.tipo_rol=$1
       GROUP BY r.id_rol`,
      [ADMIN_ROLE],
    );
    if (!roleResult.rowCount)
      throw new Error(
        "No existe el rol administrador_general en la base de datos.",
      );
    if (roleResult.rows[0].permisos < 1)
      throw new Error(
        "El rol administrador_general no tiene permisos configurados.",
      );

    const actorResult = await client.query(
      `SELECT id_usuario::text
       FROM new_horizons.usuario
       WHERE nombre_usuario='actor_pruebas_persona1'
       LIMIT 1`,
    );
    if (!actorResult.rowCount)
      throw new Error(
        "No existe el actor técnico requerido para auditar la creación inicial.",
      );

    const employeeResult = await client.query(
      `INSERT INTO new_horizons.empleado(nombre,cui,rol_id)
       VALUES($1,NULL,$2::bigint)
       RETURNING id_empleado::text`,
      [EMPLOYEE_NAME, roleResult.rows[0].id_rol],
    );

    await client.query(
      `SELECT
         set_config('new_horizons.actor_id',$1,true),
         set_config('new_horizons.motivo',$2,true)`,
      [
        actorResult.rows[0].id_usuario,
        "Creación inicial controlada de la cuenta administradora",
      ],
    );

    await client.query(
      `INSERT INTO new_horizons.usuario(
         nombre_usuario,
         contrasena_hash,
         id_empleado,
         activo,
         debe_cambiar_contrasena
       ) VALUES($1,$2,$3::bigint,TRUE,TRUE)`,
      [USERNAME, passwordHash, employeeResult.rows[0].id_empleado],
    );

    await client.query("COMMIT");
    process.stdout.write(
      "Cuenta administrador creada correctamente. Debe cambiar la contraseña en el primer ingreso.\n",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  process.stderr.write(`No se creó la cuenta: ${error.message}\n`);
  process.exitCode = 1;
});
