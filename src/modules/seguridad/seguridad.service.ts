import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";

import { Usuario } from "./entities/usuario.entity";
import { Empleado } from "./entities/empleado.entity";
import { Rol } from "./entities/rol.entity";
import { LoginDto } from "./dto/login.dto";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { CambiarContrasenaDto } from "./dto/cambiar-contrasena.dto";

@Injectable()
export class SeguridadService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,

    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,

    private readonly jwtService: JwtService,

    private readonly dataSource: DataSource,
  ) {}

  async login(datos: LoginDto) {
    const credencialesInvalidas = new UnauthorizedException(
      "Usuario o contraseña incorrectos",
    );

    // Buscar usuario
    const usuario = await this.usuarioRepository.findOne({
      where: {
        nombre_usuario: datos.nombre_usuario,
      },
    });

    if (!usuario || !usuario.activo) {
      throw credencialesInvalidas;
    }

    // Verificar contraseña
    let contrasenaValida = false;

    try {
      contrasenaValida = await argon2.verify(
        usuario.contrasena_hash,
        datos.contrasena,
      );
    } catch {
      throw credencialesInvalidas;
    }

    if (!contrasenaValida) {
      throw credencialesInvalidas;
    }

    // Consultar empleado
    const empleado = await this.empleadoRepository.findOne({
      where: {
        id_empleado: usuario.id_empleado,
      },
    });

    if (!empleado || !empleado.rol_id) {
      throw new UnauthorizedException("La cuenta no tiene un rol habilitado");
    }

    // Consultar rol
    const rol = await this.rolRepository.findOne({
      where: {
        id_rol: empleado.rol_id,
      },
    });

    if (!rol) {
      throw new UnauthorizedException("La cuenta no tiene un rol habilitado");
    }

    // Identificador único de la sesión.
    const sesionId = randomUUID();

    // Duración del token: 15 minutos.
    const duracionSegundos = 900;

    // Información mínima del JWT.
    const payload = {
      sub: usuario.id_usuario,
      empleado_id: empleado.id_empleado,
      sid: sesionId,
    };

    // Registrar la sesión y generar el JWT.
    // Si ocurre un error, se revierte la operación.
    const access_token = await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `
        INSERT INTO new_horizons.sesion_usuario (
          id_sesion,
          id_usuario,
          expira_en
        )
        VALUES (
          $1::uuid,
          $2::bigint,
          CURRENT_TIMESTAMP + INTERVAL '15 minutes'
        )
        `,
        [sesionId, usuario.id_usuario],
      );

      return this.jwtService.signAsync(payload, {
        expiresIn: duracionSegundos,
      });
    });
    // Respuesta sin contraseña ni datos sensibles
    return {
      access_token,
      token_type: "Bearer",
      expires_in: 900,
      debe_cambiar_contrasena: usuario.debe_cambiar_contrasena,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        empleado: {
          id_empleado: empleado.id_empleado,
          nombre: empleado.nombre,
        },
        rol: {
          id_rol: rol.id_rol,
          tipo_rol: rol.tipo_rol,
          id_area: rol.id_area,
        },
      },
    };
  }

  async logout(usuarioId: string, sesionId: string) {
    const resultado: Array<{ id_sesion: string }> = await this.dataSource.query(
      `
        UPDATE new_horizons.sesion_usuario
        SET revocado_en = CURRENT_TIMESTAMP
        WHERE id_sesion = $1::uuid
          AND id_usuario = $2::bigint
          AND revocado_en IS NULL
          AND expira_en > CURRENT_TIMESTAMP
        RETURNING id_sesion
        `,
      [sesionId, usuarioId],
    );

    if (resultado.length === 0) {
      throw new UnauthorizedException("La sesión ya no está vigente");
    }

    return {
      mensaje: "Sesión cerrada correctamente",
    };
  }

  async desactivarUsuario(usuarioObjetivoId: string, administradorId: string) {
    // Evitar que un administrador se desactive a sí mismo.
    if (usuarioObjetivoId === administradorId) {
      throw new BadRequestException("No puede desactivar su propia cuenta");
    }

    return this.dataSource.transaction(async (manager) => {
      // Bloquear el registro para evitar modificaciones simultáneas.
      const usuarios: Array<{
        id_usuario: string;
        activo: boolean;
      }> = await manager.query(
        `
        SELECT id_usuario::text, activo
        FROM new_horizons.usuario
        WHERE id_usuario = $1::bigint
        FOR UPDATE
        `,
        [usuarioObjetivoId],
      );

      if (usuarios.length === 0) {
        throw new NotFoundException("El usuario indicado no existe");
      }

      if (!usuarios[0].activo) {
        throw new BadRequestException("El usuario ya se encuentra desactivado");
      }

      // Establecer el contexto de auditoría dentro de la transacción.
      await manager.query(
        `
        SELECT
          set_config('new_horizons.actor_id', $1, true),
          set_config('new_horizons.motivo', $2, true)
        `,
        [administradorId, "Desactivación administrativa de usuario"],
      );

      // Desactivar la cuenta.
      await manager.query(
        `
        UPDATE new_horizons.usuario
        SET
          activo = FALSE,
          desactivado_en = CURRENT_TIMESTAMP,
          desactivado_por = $2::bigint
        WHERE id_usuario = $1::bigint
        `,
        [usuarioObjetivoId, administradorId],
      );

      // Revocar todas las sesiones del usuario.
      await manager.query(
        `
        UPDATE new_horizons.sesion_usuario
        SET revocado_en = CURRENT_TIMESTAMP
        WHERE id_usuario = $1::bigint
          AND revocado_en IS NULL
        `,
        [usuarioObjetivoId],
      );

      return {
        mensaje: "Usuario desactivado correctamente",
        usuarioId: usuarioObjetivoId,
      };
    });
  }

  async reactivarUsuario(usuarioObjetivoId: string, administradorId: string) {
    return this.dataSource.transaction(async (manager) => {
      // Bloquear el usuario durante la operación.
      const usuarios: Array<{
        id_usuario: string;
        activo: boolean;
      }> = await manager.query(
        `
      SELECT
        id_usuario::text,
        activo
      FROM new_horizons.usuario
      WHERE id_usuario = $1::bigint
      FOR UPDATE
      `,
        [usuarioObjetivoId],
      );

      if (usuarios.length === 0) {
        throw new NotFoundException("El usuario indicado no existe");
      }

      if (usuarios[0].activo) {
        throw new BadRequestException("El usuario ya se encuentra activo");
      }

      // Establecer el contexto de auditoría dentro de la transacción.
      await manager.query(
        `
        SELECT
          set_config('new_horizons.actor_id', $1, true),
          set_config('new_horizons.motivo', $2, true)
        `,
        [administradorId, "Reactivación administrativa de usuario"],
      );

      // Reactivar la cuenta.
      await manager.query(
        `
        UPDATE new_horizons.usuario
        SET
          activo = TRUE,
          desactivado_en = NULL,
          desactivado_por = NULL
        WHERE id_usuario = $1::bigint
        `,
        [usuarioObjetivoId],
      );

      // Defensa adicional: mantener revocadas las sesiones anteriores.
      await manager.query(
        `
        UPDATE new_horizons.sesion_usuario
        SET revocado_en = CURRENT_TIMESTAMP
        WHERE id_usuario = $1::bigint
          AND revocado_en IS NULL
        `,
        [usuarioObjetivoId],
      );

      return {
        mensaje: "Usuario reactivado correctamente",
        usuarioId: usuarioObjetivoId,
      };
    });
  }

  async crearUsuario(
    datos: CrearUsuarioDto,
    administradorId: string,
  ) {
    // Generar el hash fuera de la transacción para no mantener
    // bloqueos de PostgreSQL durante el procesamiento de Argon2.
    const contrasenaHash = await argon2.hash(datos.contrasena, {
      type: argon2.argon2id,
    });

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Verificar que el empleado exista y tenga un rol asignado.
        const empleados: Array<{
          id_empleado: string;
          nombre: string;
          rol_id: string | null;
        }> = await manager.query(
          `
          SELECT
            e.id_empleado::text,
            e.nombre,
            e.rol_id::text
          FROM new_horizons.empleado e
          WHERE e.id_empleado = $1::bigint
          `,
          [datos.id_empleado],
        );

        if (empleados.length === 0) {
          throw new NotFoundException(
            "El empleado indicado no existe",
          );
        }

        const empleado = empleados[0];

        if (!empleado.rol_id) {
          throw new BadRequestException(
            "El empleado no tiene un rol asignado",
          );
        }

        // Comprobar si ya existe una cuenta vinculada al empleado.
        const cuentasExistentes: Array<{ id_usuario: string }> =
          await manager.query(
            `
            SELECT id_usuario::text
            FROM new_horizons.usuario
            WHERE id_empleado = $1::bigint
            LIMIT 1
            `,
            [datos.id_empleado],
          );

        if (cuentasExistentes.length > 0) {
          throw new ConflictException(
            "El empleado ya tiene una cuenta de usuario",
          );
        }

        // Verificar que el nombre de usuario esté disponible.
        const nombresExistentes: Array<{ id_usuario: string }> =
          await manager.query(
            `
            SELECT id_usuario::text
            FROM new_horizons.usuario
            WHERE nombre_usuario = $1
            LIMIT 1
            `,
            [datos.nombre_usuario],
          );

        if (nombresExistentes.length > 0) {
          throw new ConflictException(
            "El nombre de usuario ya está registrado",
          );
        }

        // Proporcionar el contexto de auditoría al trigger.
        await manager.query(
          `
          SELECT
            set_config('new_horizons.actor_id', $1, true),
            set_config('new_horizons.motivo', $2, true)
          `,
          [
            administradorId,
            "Creación administrativa de usuario",
          ],
        );

        // Insertar la cuenta con la contraseña protegida.
        const usuariosCreados: Array<{
          id_usuario: string;
          nombre_usuario: string;
          id_empleado: string;
          activo: boolean;
        }> = await manager.query(
          `
          INSERT INTO new_horizons.usuario (
            nombre_usuario,
            contrasena_hash,
            id_empleado,
            activo
          )
          VALUES ($1, $2, $3::bigint, TRUE)
          RETURNING
            id_usuario::text,
            nombre_usuario,
            id_empleado::text,
            activo
          `,
          [
            datos.nombre_usuario,
            contrasenaHash,
            datos.id_empleado,
          ],
        );

        return {
          mensaje: "Usuario creado correctamente",
          usuario: {
            ...usuariosCreados[0],
            rol_id: empleado.rol_id,
          },
        };
      });
    } catch (error: unknown) {
      // PostgreSQL: unique_violation.
      // Respaldo ante solicitudes simultáneas.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new ConflictException(
          "El nombre de usuario o el empleado ya tiene una cuenta registrada",
        );
      }

      throw error;
    }
  }
  async cambiarContrasena(
    usuarioId: string,
    datos: CambiarContrasenaDto,
  ) {
    if (datos.contrasena_nueva !== datos.confirmar_contrasena) {
      throw new BadRequestException(
        "La confirmación de la contraseña no coincide",
      );
    }

    if (datos.contrasena_actual === datos.contrasena_nueva) {
      throw new BadRequestException(
        "La nueva contraseña debe ser diferente de la actual",
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Bloquear la cuenta durante el cambio de contraseña.
      const usuarios: Array<{
        id_usuario: string;
        contrasena_hash: string;
      }> = await manager.query(
        `
        SELECT
          id_usuario::text,
          contrasena_hash
        FROM new_horizons.usuario
        WHERE id_usuario = $1::bigint
          AND activo = TRUE
        FOR UPDATE
        `,
        [usuarioId],
      );

      if (usuarios.length === 0) {
        throw new UnauthorizedException(
          "La cuenta no está disponible",
        );
      }

      // Verificar la contraseña actual.
      let contrasenaValida = false;

      try {
        contrasenaValida = await argon2.verify(
          usuarios[0].contrasena_hash,
          datos.contrasena_actual,
        );
      } catch {
        throw new UnauthorizedException(
          "No se pudo validar la contraseña actual",
        );
      }

      if (!contrasenaValida) {
        throw new UnauthorizedException(
          "La contraseña actual es incorrecta",
        );
      }

      // Generar el nuevo hash Argon2id.
      const nuevoHash = await argon2.hash(
        datos.contrasena_nueva,
        { type: argon2.argon2id },
      );

      // Actualizar la contraseña y finalizar el cambio obligatorio.
      await manager.query(
        `
        UPDATE new_horizons.usuario
        SET
          contrasena_hash = $2,
          debe_cambiar_contrasena = FALSE
        WHERE id_usuario = $1::bigint
          AND activo = TRUE
        `,
        [usuarioId, nuevoHash],
      );

      // Revocar todas las sesiones, incluida la actual.
      await manager.query(
        `
        UPDATE new_horizons.sesion_usuario
        SET revocado_en = CURRENT_TIMESTAMP
        WHERE id_usuario = $1::bigint
          AND revocado_en IS NULL
        `,
        [usuarioId],
      );

      // Registrar el evento sin contraseñas ni hashes.
      await manager.query(
        `
        INSERT INTO new_horizons.revision_registro (
          tabla,
          registro_id,
          operacion,
          anterior,
          nuevo,
          actor_id,
          motivo
        )
        VALUES (
          'usuario',
          $1,
          'CAMBIO_CONTRASENA',
          NULL,
          jsonb_build_object('sesiones_revocadas', true),
          $2::bigint,
          'Cambio de contraseña realizado por el usuario'
        )
        `,
        [usuarioId, usuarioId],
      );

      return {
        mensaje:
          "Contraseña actualizada correctamente. Inicie sesión nuevamente.",
      };
    });
  }
}
