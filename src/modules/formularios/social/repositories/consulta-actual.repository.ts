import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../../common/errors/error-api";
import { ListaDto } from "../../../../common/dto/pagina.dto";
import {
  RegistroAreaRepository,
  camel,
} from "../../../../common/registros-area/registro-area.repository";
const DETAILS = { SOCIAL: "ficha_social" } as const;
type Tipo = keyof typeof DETAILS;
/** Conserva las consultas de main hasta integrar la reconstrucción de esta área. */
@Injectable()
export class ConsultaActualRepository {
  constructor(readonly repo: RegistroAreaRepository) {}
  async fichas(
    beneficiaria: string | null,
    hijo: string | null,
    tipo: Tipo,
    q: ListaDto,
  ) {
    const expediente = beneficiaria
      ? await this.repo.expediente(beneficiaria)
      : (await this.repo.hijo(hijo!)).expediente_id;
    // El identificador de tabla procede exclusivamente de esta lista cerrada.
    const { filas: rows, total } = await this.repo.pagina(
      `SELECT f.*,new_horizons.local_json_seguro(to_jsonb(d)-'formulario_id'-'tipo') AS detalle FROM new_horizons.formulario_area f JOIN new_horizons.${DETAILS[tipo]} d ON d.formulario_id=f.id WHERE f.expediente_id=$1 AND f.tipo=$2 AND ($3::bigint IS NULL OR f.nino_id=$3) ORDER BY f.fecha_atencion DESC,f.id DESC LIMIT $4 OFFSET $5`,
      [expediente, tipo, hijo, q.limite, (q.pagina - 1) * q.limite],
      `SELECT count(*) AS total FROM new_horizons.formulario_area f JOIN new_horizons.${DETAILS[tipo]} d ON d.formulario_id=f.id WHERE f.expediente_id=$1 AND f.tipo=$2 AND ($3::bigint IS NULL OR f.nino_id=$3)`,
      [expediente, tipo, hijo],
    );
    return {
      datos: rows.map((r: Record<string, unknown>) => ({
        ...camel(r),
        detalle: camel(r.detalle as Record<string, unknown>),
      })),
      pagina: q.pagina,
      limite: q.limite,
      total,
    };
  }
  async resumenSocial(id: string) {
    const expediente = await this.repo.expediente(id);
    const rows = await this.repo.data.query(
      "SELECT count(*)::integer AS total_fichas,max(fecha_atencion) AS ultima_atencion FROM new_horizons.formulario_area WHERE expediente_id=$1 AND tipo='SOCIAL'",
      [expediente],
    );
    const [persona] = await this.repo.data.query(
      "SELECT id_beneficiaria AS id,nombre,fecha_nac,CASE WHEN cui IS NULL THEN NULL ELSE '***' || right(cui,4) END AS cui_protegido,extract(year FROM age((now() AT TIME ZONE 'America/Guatemala')::date,fecha_nac))::integer AS edad_calculada FROM new_horizons.beneficiaria WHERE id_beneficiaria=$1",
      [id],
    );
    const [ficha] = await this.repo.data.query(
      "SELECT f.id,f.estado_codigo,f.fecha_atencion,f.actualizado_en,f.version,f.profesional_id,p.nombre AS profesional_nombre,new_horizons.local_json_seguro(to_jsonb(d)-'formulario_id'-'tipo') AS detalle FROM new_horizons.formulario_area f JOIN new_horizons.ficha_social d ON d.formulario_id=f.id JOIN new_horizons.empleado p ON p.id_empleado=f.profesional_id WHERE f.expediente_id=$1 AND f.tipo='SOCIAL' ORDER BY f.fecha_atencion DESC,f.id DESC LIMIT 1",
      [expediente],
    );
    const seguimientos = await this.repo.data.query(
      "SELECT e.id,e.accion,e.contenido,e.fecha_atencion,e.plan_seguimiento,e.resultado,e.profesional_id,p.nombre AS profesional_nombre FROM new_horizons.entrada_evolutiva e JOIN new_horizons.formulario_area f ON f.id=e.formulario_id JOIN new_horizons.empleado p ON p.id_empleado=e.profesional_id WHERE f.expediente_id=$1 AND f.tipo='SOCIAL' ORDER BY e.fecha_atencion DESC,e.id DESC LIMIT 5",
      [expediente],
    );
    const [catalogo] = await this.repo.data.query(
      "SELECT to_regclass('new_horizons.ficha_social_riesgo') IS NOT NULL AS existe",
    );
    const [riesgos] = catalogo.existe
      ? await this.repo.data.query(
          "SELECT count(*)::int AS n FROM new_horizons.ficha_social_riesgo WHERE formulario_id=$1 AND seleccionado",
          [ficha?.id ?? null],
        )
      : [{ n: null }];
    return {
      beneficiariaId: id,
      expedienteId: expediente,
      ...camel(rows[0]),
      beneficiaria: camel(persona),
      ultimaFicha: ficha
        ? {
            ...camel(ficha),
            ...camel(ficha.detalle as Record<string, unknown>),
            detalle: camel(ficha.detalle as Record<string, unknown>),
          }
        : null,
      historialReciente: seguimientos.map(camel),
      camposSinSoporte: catalogo.existe ? [] : ["totalRiesgos"],
      totalRiesgos: riesgos.n,
    };
  }
}
