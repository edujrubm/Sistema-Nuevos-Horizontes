import { EstanciaNino } from "../entities/estancia-nino.entity";
import { MovimientoNino } from "../entities/movimiento-nino.entity";
import { EventoAlbergue } from "../entities/evento-albergue.entity";
import { BeneficiariaEntity, ExpedienteEntity } from "../../beneficiarias";
import { NinoEntity } from "../../ninos";
import { EstadoAlbergue } from "../entities/estado-albergue.entity";
import { ILike } from "typeorm";
import { ErrorApi } from "../../../common/errors/error-api";
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource, QueryFailedError, IsNull, EntityManager } from "typeorm";

import { ActivoAlbergue } from "../entities/activo-albergue.entity";
import { CrearEstanciaDto } from "../dto/crear-estancia.dto";
import { MovimientoAlbergue } from "../entities/movimiento-albergue.entity";
import { CrearSalidaTemporalDto } from "../dto/crear-salida-temporal.dto";
import { CrearNacimientoDto } from "../dto/crear-nacimiento.dto";

/** Escrituras atómicas: conserva bloqueos, reloj de BD y auditoría en el mismo manager. */
@Injectable()
export class AlbergueRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private async actor(
    m: EntityManager,
    motivo = "Operación auditada de Albergue",
  ) {
    if (
      !["development", "test"].includes(
        this.config.get<string>("NODE_ENV") || process.env.NODE_ENV || "",
      )
    )
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    const [u] = await m.query(
      "SELECT id_usuario::text AS id FROM new_horizons.usuario WHERE nombre_usuario=$1",
      [
        this.config.get<string>(
          "AUDIT_ACTOR_USERNAME",
          "actor_pruebas_persona1",
        ),
      ],
    );
    if (!u)
      throw new InternalServerErrorException(
        "Actor de auditoría no configurado",
      );
    await m.query(
      "SELECT set_config('new_horizons.actor_id',$1,true),set_config('new_horizons.motivo',$2,true)",
      [u.id, motivo],
    );
    return u.id as string;
  }

  private async evento(
    m: EntityManager,
    id: string,
    tipo: string,
    motivo: string,
    movimiento?: string,
    nino?: string,
  ) {
    const actor = await this.actor(m, motivo);
    await m
      .getRepository(EventoAlbergue)
      .insert({
        estanciaId: id,
        tipo,
        registradoPor: actor,
        motivo,
        movimientoId: movimiento || null,
        ninoId: nino || null,
      });
  }

  async crearEstancia(dto: CrearEstanciaDto): Promise<ActivoAlbergue> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Verificar que la beneficiaria exista
        const beneficiaria = await manager
          .getRepository(BeneficiariaEntity)
          .findOne({
            where: { id: dto.beneficiariaId },
            lock: { mode: "pessimistic_write" },
          });
        if (!beneficiaria) {
          throw new NotFoundException("La beneficiaria no existe");
        }

        const expediente = await manager
          .getRepository(ExpedienteEntity)
          .findOne({
            where: { beneficiariaId: dto.beneficiariaId, activo: true },
          });
        if (!expediente)
          throw new ConflictException(
            "La beneficiaria requiere un expediente activo",
          );
        // 2. Verificar que no tenga una estancia activa
        const estanciaActiva = await manager.findOne(ActivoAlbergue, {
          where: {
            beneficiariaId: dto.beneficiariaId,
            fechaEgreso: IsNull(),
          },
        });

        if (estanciaActiva) {
          throw new ErrorApi("ESTANCIA_ACTIVA_EXISTENTE");
        }

        // 3. Consultar el estado Activo
        const estados = await manager.getRepository(EstadoAlbergue).find({
          where: { nombre: ILike("activo") },
          order: { id: "ASC" },
          take: 1,
        });

        if (estados.length === 0) {
          throw new InternalServerErrorException(
            "No existe el estado Activo en el catálogo de Albergue",
          );
        }

        // 4. Obtener la fecha actual de Guatemala
        const fechaActual = await manager.query(
          `
        SELECT
          (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guatemala')::date::text
          AS fecha
        `,
        );

        // 5. Crear la estancia
        const estancia = manager.create(ActivoAlbergue, {
          beneficiariaId: dto.beneficiariaId,
          fechaIngreso: fechaActual[0].fecha,
          fechaEgreso: null,
          estadoAlbergueId: String(estados[0].id),
        });

        // 6. Guardar y devolver el registro
        const guardada = await manager.save(estancia);
        const actor = await this.actor(manager);
        for (const ninoId of dto.ninoIds || []) {
          const [n] = await manager.query(
            `SELECT n.nino_id FROM new_horizons.nino n JOIN new_horizons.expediente e ON e.id_expediente=n.expediente_id WHERE n.nino_id=$1 AND e.beneficiaria_id=$2 AND n.activo=true FOR UPDATE OF n`,
            [ninoId, dto.beneficiariaId],
          );
          if (!n)
            throw new BadRequestException(
              "El niño no pertenece al expediente o está inactivo",
            );
          await manager
            .getRepository(EstanciaNino)
            .insert({
              activoAlbergueId: guardada.id,
              ninoId,
              fechaIngreso: () => "clock_timestamp()",
              registradoPor: actor,
            });
        }
        await this.evento(
          manager,
          guardada.id,
          "INGRESO",
          "Ingreso de beneficiaria y acompañantes seleccionados",
        );
        return guardada;
      });
    } catch (error: unknown) {
      // 7. Traducir conflictos de unicidad de PostgreSQL
      if (error instanceof QueryFailedError) {
        const dbError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          dbError.code === "23505" &&
          dbError.constraint === "uq_estancia_beneficiaria_activa"
        ) {
          throw new ErrorApi("ESTANCIA_ACTIVA_EXISTENTE");
        }
      }

      throw error;
    }
  }

  async registrarSalidaTemporal(
    estanciaId: string,
    dto: CrearSalidaTemporalDto,
  ): Promise<MovimientoAlbergue> {
    if (!/^[1-9]\d*$/.test(estanciaId)) {
      throw new BadRequestException("El ID de la estancia no es válido");
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear la estancia para evitar operaciones simultáneas
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder("estancia")
        .setLock("pessimistic_write")
        .where("estancia.id = :id", { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException("La estancia no existe");
      }

      // 2. Comprobar que la estancia siga abierta
      if (estancia.fechaEgreso !== null) {
        throw new ErrorApi("ESTANCIA_FINALIZADA");
      }

      // 3. Verificar si existe una salida temporal pendiente
      const salidaPendiente = await manager.findOne(MovimientoAlbergue, {
        where: {
          activoAlbergueId: estanciaId,
          entrada: IsNull(),
        },
      });

      if (salidaPendiente) {
        throw new ErrorApi("SALIDA_TEMPORAL_EXISTENTE");
      }

      // 4. Registrar la salida con fecha y hora del servidor
      const insercion = await manager
        .getRepository(MovimientoAlbergue)
        .createQueryBuilder()
        .insert()
        .values({
          activoAlbergueId: estanciaId,
          salida: () => "CURRENT_TIMESTAMP",
          entrada: null,
          destino: dto.destino,
          trabajadorAsignado: dto.trabajadorAsignado ?? null,
        })
        .returning("*")
        .execute();
      const row = insercion.raw[0];
      const resultado = [
        {
          id: row.movimiento_albergue_id,
          activoAlbergueId: row.activo_albergue_id,
          salida: row.salida,
          entrada: row.entrada,
          destino: row.destino,
          trabajadorAsignado: row.trabajador_asignado,
        },
      ];

      for (const ninoId of dto.ninoIds ?? []) {
        const estanciaNino = await manager
          .getRepository(EstanciaNino)
          .findOne({
            where: {
              activoAlbergueId: estanciaId,
              ninoId,
              fechaEgreso: IsNull(),
            },
            lock: { mode: "pessimistic_write" },
          });
        if (!estanciaNino)
          throw new BadRequestException(
            "La hija o hijo no pertenece a esta estancia activa",
          );
        await manager
          .getRepository(MovimientoNino)
          .insert({
            estanciaNinoId: estanciaNino.id,
            tipo: "SALIDA_TEMPORAL",
            destino: dto.destino,
            responsable: dto.trabajadorAsignado,
            registradoPor: await this.actor(manager),
          });
      }

      await this.evento(
        manager,
        estanciaId,
        "SALIDA_TEMPORAL",
        dto.destino,
        resultado[0].id,
      );
      return resultado[0] as MovimientoAlbergue;
    });
  }

  async registrarRetorno(estanciaId: string): Promise<MovimientoAlbergue> {
    if (!/^[1-9]\d*$/.test(estanciaId)) {
      throw new BadRequestException("El ID de la estancia no es válido");
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear la estancia para evitar operaciones simultáneas
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder("estancia")
        .setLock("pessimistic_write")
        .where("estancia.id = :id", { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException("La estancia no existe");
      }

      // 2. Verificar que la estancia esté abierta
      if (estancia.fechaEgreso !== null) {
        throw new ErrorApi("ESTANCIA_FINALIZADA");
      }

      // 3. Buscar la salida temporal pendiente
      const salidaPendiente = await manager.findOne(MovimientoAlbergue, {
        where: {
          activoAlbergueId: estanciaId,
          entrada: IsNull(),
        },
        order: {
          salida: "DESC",
        },
      });

      if (!salidaPendiente) {
        throw new ErrorApi("SALIDA_TEMPORAL_NO_EXISTENTE");
      }

      // 4. Registrar el retorno con la fecha y hora de PostgreSQL
      const actualizacion = await manager
        .getRepository(MovimientoAlbergue)
        .createQueryBuilder()
        .update()
        .set({ entrada: () => "CURRENT_TIMESTAMP" })
        .where({ id: salidaPendiente.id, entrada: IsNull() })
        .returning("*")
        .execute();
      const resultado = actualizacion.raw.map(
        (row: Record<string, unknown>) => ({
          id: row.movimiento_albergue_id,
          activoAlbergueId: row.activo_albergue_id,
          salida: row.salida,
          entrada: row.entrada,
          destino: row.destino,
          trabajadorAsignado: row.trabajador_asignado,
        }),
      );

      const filas = Array.isArray(resultado[0]) ? resultado[0] : resultado;
      if (filas.length === 0) {
        throw new ConflictException("El retorno ya fue registrado");
      }

      const actor = await this.actor(manager);
      await manager.query(
        `INSERT INTO new_horizons.movimiento_nino(estancia_nino_id,tipo,registrado_por)
         SELECT en.id,'RETORNO',$2
         FROM new_horizons.estancia_nino en
         WHERE en.activo_albergue_id=$1 AND en.fecha_egreso IS NULL
           AND (SELECT mn.tipo FROM new_horizons.movimiento_nino mn WHERE mn.estancia_nino_id=en.id ORDER BY mn.fecha DESC,mn.id DESC LIMIT 1)='SALIDA_TEMPORAL'`,
        [estanciaId, actor],
      );

      await this.evento(
        manager,
        estanciaId,
        "RETORNO",
        "Retorno de beneficiaria",
        filas[0].id,
      );
      return filas[0] as MovimientoAlbergue;
    });
  }

  async registrarEgreso(
    estanciaId: string,
    motivo: string,
  ): Promise<ActivoAlbergue> {
    if (!/^[1-9]\d*$/.test(estanciaId)) {
      throw new BadRequestException("El ID de la estancia no es válido");
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear la estancia
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder("estancia")
        .setLock("pessimistic_write")
        .where("estancia.id = :id", { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException("La estancia no existe");
      }

      // 2. Verificar que no haya egresado
      if (estancia.fechaEgreso !== null) {
        throw new ErrorApi("ESTANCIA_FINALIZADA");
      }

      // 3. Impedir egreso con una salida temporal pendiente
      const salidaPendiente = await manager.findOne(MovimientoAlbergue, {
        where: {
          activoAlbergueId: estanciaId,
          entrada: IsNull(),
        },
      });

      if (salidaPendiente) {
        throw new ErrorApi("SALIDA_TEMPORAL_EXISTENTE");
      }

      // 4. Consultar el estado Inactivo
      const estados = await manager.getRepository(EstadoAlbergue).find({
        where: { nombre: ILike("inactivo") },
        order: { id: "ASC" },
        take: 1,
      });

      if (estados.length === 0) {
        throw new InternalServerErrorException(
          "No existe el estado Inactivo en el catálogo de Albergue",
        );
      }

      // 5. Obtener la fecha actual de Guatemala
      const fechaActual = await manager.query(
        `
      SELECT
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guatemala')::date::text
        AS fecha
      `,
      );

      // 6. Actualizar la estancia
      estancia.fechaEgreso = fechaActual[0].fecha;
      estancia.estadoAlbergueId = String(estados[0].id);

      await this.actor(manager);
      await manager.query("SELECT set_config('new_horizons.motivo',$1,true)", [
        motivo,
      ]);
      await manager
        .getRepository(EstanciaNino)
        .createQueryBuilder()
        .update()
        .set({ fechaEgreso: () => "clock_timestamp()" })
        .where({ activoAlbergueId: estanciaId, fechaEgreso: IsNull() })
        .execute();
      await this.evento(manager, estanciaId, "EGRESO", motivo);
      return manager.save(estancia);
    });
  }

  async registrarNacimiento(estanciaId: string, dto: CrearNacimientoDto) {
    if (!/^[1-9]\d*$/.test(estanciaId)) {
      throw new BadRequestException("El ID de la estancia no es válido");
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear y verificar la estancia
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder("estancia")
        .setLock("pessimistic_write")
        .where("estancia.id = :id", { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException("La estancia no existe");
      }

      if (estancia.fechaEgreso !== null) {
        throw new ErrorApi("ESTANCIA_FINALIZADA");
      }

      // 2. Obtener el expediente de la beneficiaria
      const expedientes = await manager.getRepository(ExpedienteEntity).find({
        where: { beneficiariaId: estancia.beneficiariaId },
        select: { id: true },
      });

      if (expedientes.length === 0) {
        throw new ConflictException(
          "La beneficiaria no tiene un expediente registrado",
        );
      }

      const expedienteId = expedientes[0].id as string;

      // 3. Validar que la fecha sea válida y no sea futura
      const fecha = await manager.query(
        `
      SELECT
        $1::date <=
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guatemala')::date
        AS valida
      `,
        [dto.fechaNacimiento],
      );

      if (!fecha[0].valida) {
        throw new BadRequestException(
          "La fecha de nacimiento no puede ser futura",
        );
      }

      // 4. Buscar posibles registros duplicados
      const coincidencias = await manager.query(
        `
      SELECT nino_id::text AS id
      FROM new_horizons.nino
      WHERE expediente_id = $1
        AND LOWER(nombre) = LOWER($2)
        AND fecha_nac = $3::date
      `,
        [expedienteId, dto.nombre.trim(), dto.fechaNacimiento],
      );

      if (coincidencias.length > 0) {
        throw new ConflictException(
          "Ya existe un niño con ese nombre y fecha de nacimiento en el expediente",
        );
      }

      // La identidad técnica y el motivo se fijan antes del alta en la misma conexión.
      const actor = await this.actor(
        manager,
        "Registro de nacimiento en albergue",
      );

      // 5. Registrar al recién nacido
      const nuevo = await manager.getRepository(NinoEntity).save({
        expedienteId,
        nombre: dto.nombre.trim(),
        fechaNacimiento: dto.fechaNacimiento,
        cui: dto.cui ?? null,
        genero: dto.genero ?? null,
        reconocido: dto.reconocido ?? null,
      });
      const resultado = [
        {
          id: nuevo.id,
          expedienteId: nuevo.expedienteId,
          nombre: nuevo.nombre,
          fechaNacimiento: nuevo.fechaNacimiento,
          cui: nuevo.cui,
          genero: nuevo.genero,
          reconocido: nuevo.reconocido,
        },
      ];

      await manager
        .getRepository(EstanciaNino)
        .insert({
          activoAlbergueId: estanciaId,
          ninoId: resultado[0].id,
          fechaIngreso: () => "clock_timestamp()",
          registradoPor: actor,
        });
      await this.evento(
        manager,
        estanciaId,
        "NACIMIENTO",
        "Nacimiento y vinculación a estancia",
        undefined,
        resultado[0].id,
      );
      return resultado[0];
    });
  }
}
