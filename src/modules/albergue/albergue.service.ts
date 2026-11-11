import { ErrorApi } from "../../common/errors/error-api";
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import {
  DataSource,
  Repository,
  QueryFailedError,
  IsNull,
  EntityManager,
} from "typeorm";

import { ActivoAlbergue } from "./entities/activo-albergue.entity";
import { CrearEstanciaDto } from "./dto/crear-estancia.dto";
import { MovimientoAlbergue } from "./entities/movimiento-albergue.entity";
import { CrearSalidaTemporalDto } from "./dto/crear-salida-temporal.dto";
import { CrearNacimientoDto } from "./dto/crear-nacimiento.dto";

import {
  ConsultaEstanciasDto,
  HistorialAlbergueDto,
} from "./dto/operacion.dto";

@Injectable()
export class AlbergueService {
  constructor(
    @InjectRepository(ActivoAlbergue)
    private readonly estanciaRepository: Repository<ActivoAlbergue>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private async actor(m: EntityManager) {
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
      [u.id, "Operación auditada de Albergue"],
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
    const actor = await this.actor(m);
    await m.query(
      "INSERT INTO new_horizons.evento_albergue(estancia_id,tipo,registrado_por,motivo,movimiento_id,nino_id) VALUES($1,$2,$3,$4,$5,$6)",
      [id, tipo, actor, motivo, movimiento || null, nino || null],
    );
  }
  async listarEstancias(
    pagina = 1,
    limite = 20,
    q: ConsultaEstanciasDto = new ConsultaEstanciasDto(),
  ) {
    const where = `FROM new_horizons.activos_albergue a JOIN new_horizons.beneficiaria b ON b.id_beneficiaria=a.beneficiaria_id
     WHERE ($1='TODAS' OR ($1='ACTIVAS' AND a.fecha_egreso IS NULL) OR ($1='FINALIZADAS' AND a.fecha_egreso IS NOT NULL))
     AND ($2='TODOS' OR ($2='SALIDA' AND EXISTS(SELECT 1 FROM new_horizons.movimiento_albergue m WHERE m.activo_albergue_id=a.activo_albergue_id AND m.entrada IS NULL)) OR ($2='SITIO' AND NOT EXISTS(SELECT 1 FROM new_horizons.movimiento_albergue m WHERE m.activo_albergue_id=a.activo_albergue_id AND m.entrada IS NULL)))
     AND ($3='' OR strpos(lower(b.nombre),lower($3))>0 OR b.cui=$3)`;
    const args = [
      q.estado || "TODAS",
      q.presencia || "TODOS",
      q.buscar?.trim() || "",
    ];
    const datos = await this.dataSource.query(
      `SELECT a.activo_albergue_id::text AS id,a.beneficiaria_id::text AS "beneficiariaId",b.nombre AS "beneficiariaNombre", a.fecha_ingreso::text AS "fechaIngreso",a.fecha_egreso::text AS "fechaEgreso",a.estado_albergue_id::text AS "estadoAlbergueId",
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',n.nino_id::text,'nombre',n.nombre)),'[]'::jsonb) FROM new_horizons.estancia_nino en JOIN new_horizons.nino n ON n.nino_id=en.nino_id WHERE en.activo_albergue_id=a.activo_albergue_id AND en.fecha_egreso IS NULL) AS acompanantes,
      EXISTS(SELECT 1 FROM new_horizons.movimiento_albergue m WHERE m.activo_albergue_id=a.activo_albergue_id AND m.entrada IS NULL) AS "salidaPendiente",
      (SELECT count(*)::int FROM new_horizons.estancia_nino n WHERE n.activo_albergue_id=a.activo_albergue_id AND n.fecha_egreso IS NULL) AS "menoresActivos" ${where} ORDER BY a.activo_albergue_id DESC LIMIT $4 OFFSET $5`,
      [...args, limite, (pagina - 1) * limite],
    );
    const [c] = await this.dataSource.query(
      `SELECT count(*)::int AS total ${where}`,
      args,
    );
    return {
      datos,
      paginacion: {
        pagina,
        limite,
        total: c.total,
        totalPaginas: Math.ceil(c.total / limite),
      },
    };
  }

  async obtenerEstancia(id: string) {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new BadRequestException("El ID de la estancia no es válido");
    }

    const estancia = await this.estanciaRepository.findOne({
      where: { id },
    });

    if (!estancia) {
      throw new NotFoundException("La estancia no existe");
    }

    // Consultar menores asociados a la estancia
    const menores = await this.dataSource.query(
      `
    SELECT
      en.id::text AS "id",
      en.nino_id::text AS "ninoId",
      en.fecha_ingreso AS "fechaIngreso",
      en.fecha_egreso AS "fechaEgreso", n.nombre
    FROM new_horizons.estancia_nino en JOIN new_horizons.nino n ON n.nino_id=en.nino_id
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
          throw new NotFoundException("La beneficiaria no existe");
        }

        const [expediente] = await manager.query(
          "SELECT id_expediente FROM new_horizons.expediente WHERE beneficiaria_id=$1 AND activo=true",
          [dto.beneficiariaId],
        );
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
          estadoAlbergueId: String(estados[0].estado_albergue_id),
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
          await manager.query(
            "INSERT INTO new_horizons.estancia_nino(activo_albergue_id,nino_id,fecha_ingreso,registrado_por) VALUES($1,$2,clock_timestamp(),$3)",
            [guardada.id, ninoId, actor],
          );
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

      const filas = Array.isArray(resultado[0]) ? resultado[0] : resultado;
      if (filas.length === 0) {
        throw new ConflictException("El retorno ya fue registrado");
      }

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
      estancia.estadoAlbergueId = String(estados[0].estado_albergue_id);

      await this.actor(manager);
      await manager.query("SELECT set_config('new_horizons.motivo',$1,true)", [
        motivo,
      ]);
      await manager.query(
        "UPDATE new_horizons.estancia_nino SET fecha_egreso=clock_timestamp() WHERE activo_albergue_id=$1 AND fecha_egreso IS NULL",
        [estanciaId],
      );
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

      // El trigger de nino exige el mismo contexto auditado que el módulo de niños.
      const usuarios = await manager.query(
        "SELECT id_usuario::text AS id FROM new_horizons.usuario WHERE nombre_usuario = $1",
        [
          this.config.get<string>(
            "AUDIT_ACTOR_USERNAME",
            "actor_pruebas_persona1",
          ),
        ],
      );
      if (!usuarios[0])
        throw new InternalServerErrorException(
          "No existe el actor técnico de auditoría configurado",
        );
      await manager.query(
        "SELECT set_config('new_horizons.actor_id', $1, true)",
        [usuarios[0].id],
      );
      await manager.query(
        "SELECT set_config('new_horizons.motivo', $1, true)",
        ["Registro de nacimiento en albergue"],
      );

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

      await manager.query(
        "INSERT INTO new_horizons.estancia_nino(activo_albergue_id,nino_id,fecha_ingreso,registrado_por) VALUES($1,$2,clock_timestamp(),$3)",
        [estanciaId, resultado[0].id, usuarios[0].id],
      );
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

    const [menores] = await this.dataSource.query(
      `SELECT count(*)::int AS total FROM new_horizons.estancia_nino n JOIN new_horizons.activos_albergue a ON a.activo_albergue_id=n.activo_albergue_id WHERE n.fecha_egreso IS NULL AND a.fecha_egreso IS NULL`,
    );
    return {
      ...resultado[0],
      menoresActivos: menores.total,
      personasActivas: resultado[0].estanciasActivas + menores.total,
    };
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

  async historial(q: HistorialAlbergueDto) {
    const validDate = (s?: string) =>
      !s ||
      (!Number.isNaN(Date.parse(s + "T12:00:00Z")) &&
        new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s);
    if (
      !validDate(q.desde) ||
      !validDate(q.hasta) ||
      (q.desde && q.hasta && q.desde > q.hasta)
    )
      throw new BadRequestException("Rango de fechas inválido");
    const from = `FROM new_horizons.evento_albergue ev JOIN new_horizons.activos_albergue a ON a.activo_albergue_id=ev.estancia_id JOIN new_horizons.beneficiaria b ON b.id_beneficiaria=a.beneficiaria_id JOIN new_horizons.usuario u ON u.id_usuario=ev.registrado_por WHERE ($1::text IS NULL OR ev.tipo=$1) AND ($2::date IS NULL OR (ev.fecha AT TIME ZONE 'America/Guatemala')::date >=$2::date) AND ($3::date IS NULL OR (ev.fecha AT TIME ZONE 'America/Guatemala')::date <=$3::date)`;
    const args = [q.tipo || null, q.desde || null, q.hasta || null];
    const datos = await this.dataSource.query(
      `SELECT ev.id::text,ev.estancia_id::text AS "estanciaId",ev.tipo,ev.fecha,ev.motivo,u.nombre_usuario AS responsable,b.nombre AS "beneficiariaNombre" ${from} ORDER BY ev.fecha DESC,ev.id DESC LIMIT $4 OFFSET $5`,
      [...args, q.limite, (q.pagina - 1) * q.limite],
    );
    const [c] = await this.dataSource.query(
      `SELECT count(*)::int AS total ${from}`,
      args,
    );
    return {
      datos,
      paginacion: {
        pagina: q.pagina,
        limite: q.limite,
        total: c.total,
        totalPaginas: Math.ceil(c.total / q.limite),
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
