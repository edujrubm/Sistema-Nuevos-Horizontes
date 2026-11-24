import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { ActivoAlbergue } from "../entities/activo-albergue.entity";
import { EstadoAlbergue } from "../entities/estado-albergue.entity";
import {
  ConsultaEstanciasDto,
  HistorialAlbergueDto,
} from "../dto/operacion.dto";

/** Proyecciones del panel e historial; JSONB y agregados se resuelven en PostgreSQL. */
@Injectable()
export class AlbergueConsultasRepository {
  constructor(private readonly dataSource: DataSource) {}

  async listarEstancias(
    pagina = 1,
    limite = 20,
    q: ConsultaEstanciasDto = new ConsultaEstanciasDto(),
  ) {
    return this.dataSource.transaction("REPEATABLE READ", async (manager) => {
      const where = `FROM new_horizons.activos_albergue a JOIN new_horizons.beneficiaria b ON b.id_beneficiaria=a.beneficiaria_id
     WHERE ($1='TODAS' OR ($1='ACTIVAS' AND a.fecha_egreso IS NULL) OR ($1='FINALIZADAS' AND a.fecha_egreso IS NOT NULL AND NOT EXISTS(
       SELECT 1 FROM new_horizons.activos_albergue activa
       WHERE activa.beneficiaria_id=a.beneficiaria_id AND activa.fecha_egreso IS NULL
     )))
     AND ($2='TODOS' OR ($2='SALIDA' AND EXISTS(SELECT 1 FROM new_horizons.movimiento_albergue m WHERE m.activo_albergue_id=a.activo_albergue_id AND m.entrada IS NULL)) OR ($2='SITIO' AND NOT EXISTS(SELECT 1 FROM new_horizons.movimiento_albergue m WHERE m.activo_albergue_id=a.activo_albergue_id AND m.entrada IS NULL)))
     AND ($3='' OR strpos(lower(b.nombre),lower($3))>0 OR b.cui=$3)`;
      const args = [
        q.estado || "TODAS",
        q.presencia || "TODOS",
        q.buscar?.trim() || "",
      ];
      const datos = await manager.query(
        `SELECT a.activo_albergue_id::text AS id,a.beneficiaria_id::text AS "beneficiariaId",b.nombre AS "beneficiariaNombre", a.fecha_ingreso::text AS "fechaIngreso",a.fecha_egreso::text AS "fechaEgreso",a.estado_albergue_id::text AS "estadoAlbergueId",
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',n.nino_id::text,'nombre',n.nombre,'fechaEgreso',en.fecha_egreso::text,'salidaTemporal',COALESCE((SELECT mn.tipo='SALIDA_TEMPORAL' FROM new_horizons.movimiento_nino mn WHERE mn.estancia_nino_id=en.id ORDER BY mn.fecha DESC,mn.id DESC LIMIT 1),false))),'[]'::jsonb) FROM new_horizons.estancia_nino en JOIN new_horizons.nino n ON n.nino_id=en.nino_id WHERE en.activo_albergue_id=a.activo_albergue_id) AS acompanantes,
      EXISTS(SELECT 1 FROM new_horizons.movimiento_albergue m WHERE m.activo_albergue_id=a.activo_albergue_id AND m.entrada IS NULL) AS "salidaPendiente",
      (SELECT m.trabajador_asignado FROM new_horizons.movimiento_albergue m WHERE m.activo_albergue_id=a.activo_albergue_id AND m.entrada IS NULL ORDER BY m.salida DESC,m.movimiento_albergue_id DESC LIMIT 1) AS "trabajadorAsignado",
      (SELECT count(*)::int FROM new_horizons.estancia_nino n WHERE n.activo_albergue_id=a.activo_albergue_id AND n.fecha_egreso IS NULL) AS "menoresActivos" ${where} ORDER BY a.activo_albergue_id DESC LIMIT $4 OFFSET $5`,
        [...args, limite, (pagina - 1) * limite],
      );
      const [c] = await manager.query(
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
    });
  }

  async obtenerEstancia(id: string) {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new BadRequestException("El ID de la estancia no es válido");
    }

    const estancia = await this.dataSource
      .getRepository(ActivoAlbergue)
      .findOne({
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

  async obtenerResumen() {
    return this.dataSource.transaction("REPEATABLE READ", async (manager) => {
      const resultado = await manager.query(`
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

      const [menores] = await manager.query(
        `SELECT count(*)::int AS total FROM new_horizons.estancia_nino n JOIN new_horizons.activos_albergue a ON a.activo_albergue_id=n.activo_albergue_id WHERE n.fecha_egreso IS NULL AND a.fecha_egreso IS NULL`,
      );
      return {
        ...resultado[0],
        menoresActivos: menores.total,
        personasActivas: resultado[0].estanciasActivas + menores.total,
      };
    });
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
    return this.dataSource.transaction("REPEATABLE READ", async (manager) => {
      const offset = (pagina - 1) * limite;

      const [movimientos, conteo] = await Promise.all([
        manager.query(
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

        manager.query(`
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
    });
  }

  async historial(q: HistorialAlbergueDto) {
    return this.dataSource.transaction("REPEATABLE READ", async (manager) => {
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
      const from = `FROM new_horizons.evento_albergue ev JOIN new_horizons.activos_albergue a ON a.activo_albergue_id=ev.estancia_id JOIN new_horizons.beneficiaria b ON b.id_beneficiaria=a.beneficiaria_id JOIN new_horizons.usuario u ON u.id_usuario=ev.registrado_por WHERE ($1::text IS NULL OR ev.tipo=$1) AND ($2::date IS NULL OR (ev.fecha AT TIME ZONE 'America/Guatemala')::date >=$2::date) AND ($3::date IS NULL OR (ev.fecha AT TIME ZONE 'America/Guatemala')::date <=$3::date) AND ($4='' OR strpos(lower(b.nombre), lower($4)) > 0 OR b.cui=$4)`;
      const args = [
        q.tipo || null,
        q.desde || null,
        q.hasta || null,
        q.buscar?.trim() || "",
      ];
      const datos = await manager.query(
        `SELECT ev.id::text,ev.estancia_id::text AS "estanciaId",ev.tipo,ev.fecha,ev.motivo,u.nombre_usuario AS responsable,b.nombre AS "beneficiariaNombre" ${from} ORDER BY ev.fecha DESC,ev.id DESC LIMIT $5 OFFSET $6`,
        [...args, q.limite, (q.pagina - 1) * q.limite],
      );
      const [c] = await manager.query(
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
    });
  }

  async listarEstados() {
    return this.dataSource
      .getRepository(EstadoAlbergue)
      .find({ select: { id: true, nombre: true }, order: { id: "ASC" } });
  }
}
