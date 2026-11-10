import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, QueryFailedError, IsNull } from 'typeorm';

import { ActivoAlbergue } from './entities/activo-albergue.entity';
import { CrearEstanciaDto } from './dto/crear-estancia.dto';
import { MovimientoAlbergue } from './entities/movimiento-albergue.entity';
import { CrearSalidaTemporalDto } from './dto/crear-salida-temporal.dto';
import { CrearNacimientoDto } from './dto/crear-nacimiento.dto';

@Injectable()
export class AlbergueService {
  constructor(
    @InjectRepository(ActivoAlbergue)
    private readonly estanciaRepository: Repository<ActivoAlbergue>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // Listar todas las estancias
  async listarEstancias(pagina = 1, limite = 20) {
    const [datos, total] = await this.estanciaRepository.findAndCount({
      order: { id: 'DESC' },
      skip: (pagina - 1) * limite,
      take: limite,
    });

    return {
      datos,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  async obtenerEstancia(id: string) {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new BadRequestException('El ID de la estancia no es válido');
    }

    const estancia = await this.estanciaRepository.findOne({
      where: { id },
    });

    if (!estancia) {
      throw new NotFoundException('La estancia no existe');
    }

    // Consultar menores asociados a la estancia
    const menores = await this.dataSource.query(
      `
    SELECT
      en.id::text AS "id",
      en.nino_id::text AS "ninoId",
      en.fecha_ingreso AS "fechaIngreso",
      en.fecha_egreso AS "fechaEgreso"
    FROM new_horizons.estancia_nino en
    WHERE en.activo_albergue_id = $1
    ORDER BY en.fecha_ingreso DESC
    `,
      [id],
    );

    return {
      ...estancia,
      menoresAsociados: menores,
    };
  }

  // Registrar ingreso de una beneficiaria
  async crearEstancia(dto: CrearEstanciaDto): Promise<ActivoAlbergue> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Verificar que la beneficiaria exista
        const beneficiarias = await manager.query(
          `
        SELECT id_beneficiaria
        FROM new_horizons.beneficiaria
        WHERE id_beneficiaria = $1
        FOR UPDATE
        `,
          [dto.beneficiariaId],
        );

        if (beneficiarias.length === 0) {
          throw new NotFoundException('La beneficiaria no existe');
        }

        // 2. Verificar que no tenga una estancia activa
        const estanciaActiva = await manager.findOne(ActivoAlbergue, {
          where: {
            beneficiariaId: dto.beneficiariaId,
            fechaEgreso: IsNull(),
          },
        });

        if (estanciaActiva) {
          throw new ConflictException(
            'La beneficiaria ya tiene una estancia activa',
          );
        }

        // 3. Consultar el estado Activo
        const estados = await manager.query(
          `
        SELECT estado_albergue_id
        FROM new_horizons.estado_albergue
        WHERE LOWER(nombre) = 'activo'
        ORDER BY estado_albergue_id
        LIMIT 1
        `,
        );

        if (estados.length === 0) {
          throw new InternalServerErrorException(
            'No existe el estado Activo en el catálogo de Albergue',
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
          estadoAlbergueId: String(estados[0].estado_albergue_id),
        });

        // 6. Guardar y devolver el registro
        return await manager.save(estancia);
      });
    } catch (error: unknown) {
      // 7. Traducir conflictos de unicidad de PostgreSQL
      if (error instanceof QueryFailedError) {
        const dbError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          dbError.code === '23505' &&
          dbError.constraint === 'uq_estancia_beneficiaria_activa'
        ) {
          throw new ConflictException(
            'La beneficiaria ya tiene una estancia activa',
          );
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
      throw new BadRequestException('El ID de la estancia no es válido');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear la estancia para evitar operaciones simultáneas
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder('estancia')
        .setLock('pessimistic_write')
        .where('estancia.id = :id', { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException('La estancia no existe');
      }

      // 2. Comprobar que la estancia siga abierta
      if (estancia.fechaEgreso !== null) {
        throw new ConflictException(
          'No se puede registrar una salida de una estancia finalizada',
        );
      }

      // 3. Verificar si existe una salida temporal pendiente
      const salidaPendiente = await manager.findOne(MovimientoAlbergue, {
        where: {
          activoAlbergueId: estanciaId,
          entrada: IsNull(),
        },
      });

      if (salidaPendiente) {
        throw new ConflictException(
          'La estancia ya tiene una salida temporal pendiente',
        );
      }

      // 4. Registrar la salida con fecha y hora del servidor
      const resultado = await manager.query(
        `
      INSERT INTO new_horizons.movimiento_albergue (
        activo_albergue_id,
        salida,
        entrada,
        destino,
        trabajador_asignado
      )
      VALUES ($1, CURRENT_TIMESTAMP, NULL, $2, $3)
      RETURNING
        movimiento_albergue_id::text AS "id",
        activo_albergue_id::text AS "activoAlbergueId",
        salida,
        entrada,
        destino,
        trabajador_asignado AS "trabajadorAsignado"
      `,
        [estanciaId, dto.destino, dto.trabajadorAsignado ?? null],
      );

      return resultado[0] as MovimientoAlbergue;
    });
  }

  async registrarRetorno(estanciaId: string): Promise<MovimientoAlbergue> {
    if (!/^[1-9]\d*$/.test(estanciaId)) {
      throw new BadRequestException('El ID de la estancia no es válido');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear la estancia para evitar operaciones simultáneas
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder('estancia')
        .setLock('pessimistic_write')
        .where('estancia.id = :id', { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException('La estancia no existe');
      }

      // 2. Verificar que la estancia esté abierta
      if (estancia.fechaEgreso !== null) {
        throw new ConflictException(
          'No se puede registrar un retorno de una estancia finalizada',
        );
      }

      // 3. Buscar la salida temporal pendiente
      const salidaPendiente = await manager.findOne(MovimientoAlbergue, {
        where: {
          activoAlbergueId: estanciaId,
          entrada: IsNull(),
        },
        order: {
          salida: 'DESC',
        },
      });

      if (!salidaPendiente) {
        throw new ConflictException(
          'La estancia no tiene una salida temporal pendiente',
        );
      }

      // 4. Registrar el retorno con la fecha y hora de PostgreSQL
      const resultado = await manager.query(
        `
      UPDATE new_horizons.movimiento_albergue
      SET entrada = CURRENT_TIMESTAMP
      WHERE movimiento_albergue_id = $1
        AND entrada IS NULL
      RETURNING
        movimiento_albergue_id::text AS "id",
        activo_albergue_id::text AS "activoAlbergueId",
        salida,
        entrada,
        destino,
        trabajador_asignado AS "trabajadorAsignado"
      `,
        [salidaPendiente.id],
      );

      if (resultado.length === 0) {
        throw new ConflictException('El retorno ya fue registrado');
      }

      return resultado[0] as MovimientoAlbergue;
    });
  }

  async registrarEgreso(estanciaId: string): Promise<ActivoAlbergue> {
    if (!/^[1-9]\d*$/.test(estanciaId)) {
      throw new BadRequestException('El ID de la estancia no es válido');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear la estancia
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder('estancia')
        .setLock('pessimistic_write')
        .where('estancia.id = :id', { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException('La estancia no existe');
      }

      // 2. Verificar que no haya egresado
      if (estancia.fechaEgreso !== null) {
        throw new ConflictException('La estancia ya fue finalizada');
      }

      // 3. Impedir egreso con una salida temporal pendiente
      const salidaPendiente = await manager.findOne(MovimientoAlbergue, {
        where: {
          activoAlbergueId: estanciaId,
          entrada: IsNull(),
        },
      });

      if (salidaPendiente) {
        throw new ConflictException(
          'No se puede registrar el egreso mientras exista una salida temporal pendiente',
        );
      }

      // 4. Consultar el estado Inactivo
      const estados = await manager.query(
        `
      SELECT estado_albergue_id
      FROM new_horizons.estado_albergue
      WHERE LOWER(nombre) = 'inactivo'
      ORDER BY estado_albergue_id
      LIMIT 1
      `,
      );

      if (estados.length === 0) {
        throw new InternalServerErrorException(
          'No existe el estado Inactivo en el catálogo de Albergue',
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
      estancia.estadoAlbergueId = String(estados[0].estado_albergue_id);

      return manager.save(estancia);
    });
  }

  async registrarNacimiento(estanciaId: string, dto: CrearNacimientoDto) {
    if (!/^[1-9]\d*$/.test(estanciaId)) {
      throw new BadRequestException('El ID de la estancia no es válido');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Bloquear y verificar la estancia
      const estancia = await manager
        .getRepository(ActivoAlbergue)
        .createQueryBuilder('estancia')
        .setLock('pessimistic_write')
        .where('estancia.id = :id', { id: estanciaId })
        .getOne();

      if (!estancia) {
        throw new NotFoundException('La estancia no existe');
      }

      if (estancia.fechaEgreso !== null) {
        throw new ConflictException(
          'No se pueden registrar nacimientos en una estancia finalizada',
        );
      }

      // 2. Obtener el expediente de la beneficiaria
      const expedientes = await manager.query(
        `
      SELECT id_expediente::text AS id
      FROM new_horizons.expediente
      WHERE beneficiaria_id = $1
      `,
        [estancia.beneficiariaId],
      );

      if (expedientes.length === 0) {
        throw new ConflictException(
          'La beneficiaria no tiene un expediente registrado',
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
          'La fecha de nacimiento no puede ser futura',
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
          'Ya existe un niño con ese nombre y fecha de nacimiento en el expediente',
        );
      }

      // 5. Registrar al recién nacido
      const resultado = await manager.query(
        `
      INSERT INTO new_horizons.nino (
        expediente_id,
        nombre,
        fecha_nac,
        cui,
        genero,
        reconocido
      )
      VALUES ($1, $2, $3::date, $4, $5, $6)
      RETURNING
        nino_id::text AS "id",
        expediente_id::text AS "expedienteId",
        nombre,
        fecha_nac::text AS "fechaNacimiento",
        cui,
        genero,
        reconocido
      `,
        [
          expedienteId,
          dto.nombre.trim(),
          dto.fechaNacimiento,
          dto.cui ?? null,
          dto.genero ?? null,
          dto.reconocido ?? null,
        ],
      );

      return resultado[0];
    });
  }

  async obtenerResumen() {
    const resultado = await this.dataSource.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE a.fecha_egreso IS NULL
      )::int AS "estanciasActivas",

      COUNT(*) FILTER (
        WHERE a.fecha_egreso IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM new_horizons.movimiento_albergue m
            WHERE m.activo_albergue_id = a.activo_albergue_id
              AND m.entrada IS NULL
          )
      )::int AS "beneficiariasPresentes",

      COUNT(*) FILTER (
        WHERE a.fecha_egreso IS NULL
          AND EXISTS (
            SELECT 1
            FROM new_horizons.movimiento_albergue m
            WHERE m.activo_albergue_id = a.activo_albergue_id
              AND m.entrada IS NULL
          )
      )::int AS "salidasTemporalesPendientes",

      COUNT(*) FILTER (
        WHERE a.fecha_egreso IS NOT NULL
      )::int AS "egresosRegistrados"

    FROM new_horizons.activos_albergue a
  `);

    return resultado[0];
  }

  async listarSalidasPendientes() {
    return this.dataSource.query(`
    SELECT
      m.movimiento_albergue_id::text AS "movimientoId",
      m.activo_albergue_id::text AS "estanciaId",
      a.beneficiaria_id::text AS "beneficiariaId",
      b.nombre AS "beneficiariaNombre",
      m.salida AS "fechaSalida",
      m.destino,
      m.trabajador_asignado AS "trabajadorAsignado"
    FROM new_horizons.movimiento_albergue m
    INNER JOIN new_horizons.activos_albergue a
      ON a.activo_albergue_id = m.activo_albergue_id
    INNER JOIN new_horizons.beneficiaria b
      ON b.id_beneficiaria = a.beneficiaria_id
    WHERE m.entrada IS NULL
      AND a.fecha_egreso IS NULL
    ORDER BY m.salida DESC
  `);
  }

  async listarMovimientos(pagina = 1, limite = 20) {
    const offset = (pagina - 1) * limite;

    const [movimientos, conteo] = await Promise.all([
      this.dataSource.query(
        `
      SELECT
        m.movimiento_albergue_id::text AS "movimientoId",
        m.activo_albergue_id::text AS "estanciaId",
        a.beneficiaria_id::text AS "beneficiariaId",
        b.nombre AS "beneficiariaNombre",
        m.salida AS "fechaSalida",
        m.entrada AS "fechaRetorno",
        m.destino,
        m.trabajador_asignado AS "trabajadorAsignado",
        CASE
          WHEN m.entrada IS NULL THEN 'PENDIENTE'
          ELSE 'COMPLETADO'
        END AS "estadoMovimiento"
      FROM new_horizons.movimiento_albergue m
      INNER JOIN new_horizons.activos_albergue a
        ON a.activo_albergue_id = m.activo_albergue_id
      INNER JOIN new_horizons.beneficiaria b
        ON b.id_beneficiaria = a.beneficiaria_id
      ORDER BY m.salida DESC, m.movimiento_albergue_id DESC
      LIMIT $1 OFFSET $2
      `,
        [limite, offset],
      ),

      this.dataSource.query(`
      SELECT COUNT(*)::int AS total
      FROM new_horizons.movimiento_albergue
    `),
    ]);

    const total = conteo[0].total;

    return {
      datos: movimientos,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  async listarEstados() {
    return this.dataSource.query(`
    SELECT
      estado_albergue_id::text AS "id",
      nombre
    FROM new_horizons.estado_albergue
    ORDER BY estado_albergue_id ASC
  `);
  }
}
