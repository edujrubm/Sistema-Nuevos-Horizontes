import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RegistroAreaRepository } from "../../../common/registros-area/registro-area.repository";
import { ErrorApi } from "../../../common/errors/error-api";
import { DocumentoArea } from "../entities/documento-area.entity";
import { DocumentosListaDto } from "../documentos-lista.dto";
import { TransicionDto } from "../../../common/dto/version.dto";
import { AreaFormularioEntity } from "../../formularios/shared/entities/formulario-catalogos.entity";
import { FormularioAreaEntity } from "../../formularios/shared/entities/formulario-area.entity";

/** CRUD tipado y proyecciones complejas; nunca entrega la clave privada a HTTP. */
@Injectable()
export class DocumentosRepository {
  constructor(
    readonly repo: RegistroAreaRepository,
    readonly data: DataSource,
  ) {}
  documento(id: string, manager = this.data.manager, lock = false) {
    return manager.getRepository(DocumentoArea).findOne({
      where: { id },
      ...(lock ? { lock: { mode: "pessimistic_write" as const } } : {}),
    });
  }
  async areaNombre(id: string, manager = this.data.manager) {
    return (
      await manager
        .getRepository(AreaFormularioEntity)
        .findOne({ where: { id } })
    )?.nombre;
  }
  inscrito(ninoId: string, manager = this.data.manager) {
    if (!ninoId || !process.env.FORM_CONFIRMED_STATE_CODE)
      return Promise.resolve(false);
    return manager.getRepository(FormularioAreaEntity).exists({
      where: {
        ninoId,
        tipo: "GUARDERIA",
        estadoCodigo: process.env.FORM_CONFIRMED_STATE_CODE,
      },
    });
  }
  async contexto(id: string, area: string) {
    const formularios = await this.repo.data.query(
      `SELECT f.id::text, f.tipo, f.estado_codigo AS "estadoCodigo", f.nino_id::text AS "ninoId", f.fecha_atencion AS "fechaAtencion"
      FROM new_horizons.formulario_area f JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id JOIN new_horizons.area a ON a.id_area=f.area_id
      WHERE e.beneficiaria_id=$1 AND a.nombre_area=$2 AND (f.tipo<>'GUARDERIA' OR EXISTS(SELECT 1 FROM new_horizons.formulario_area i WHERE i.nino_id=f.nino_id AND i.tipo='GUARDERIA' AND i.estado_codigo=$3)) ORDER BY f.id DESC`,
      [id, area, process.env.FORM_CONFIRMED_STATE_CODE],
    );
    const ids = formularios.map((f: { id: string }) => f.id);
    const [resumen] = await this.repo.data.query(
      `SELECT count(*)::int AS "versionesConservadas", COALESCE(sum(tamano_bytes),0)::text AS "tamanoBytes",
      count(*) FILTER(WHERE anulado_en IS NULL AND NOT EXISTS(SELECT 1 FROM new_horizons.documento_area h WHERE h.documento_anterior_id=d.id))::int AS "documentosActivos",
      count(*) FILTER(WHERE anulado_en IS NOT NULL AND NOT EXISTS(SELECT 1 FROM new_horizons.documento_area h WHERE h.documento_anterior_id=d.id))::int AS "documentosAnulados"
      FROM new_horizons.documento_area d WHERE formulario_id=ANY($1::bigint[])`,
      [ids],
    );
    const categorias = await this.repo.data.query(
      "SELECT DISTINCT categoria FROM new_horizons.documento_area WHERE formulario_id=ANY($1::bigint[]) ORDER BY categoria",
      [ids],
    );
    return {
      formularios,
      resumen,
      categorias: categorias.map((x: { categoria: string }) => x.categoria),
    };
  }
  async listar(id: string, q: DocumentosListaDto, area: string) {
    const where = `FROM new_horizons.documento_area d JOIN new_horizons.formulario_area f ON f.id=d.formulario_id JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id JOIN new_horizons.area a ON a.id_area=f.area_id WHERE e.beneficiaria_id=$1 AND a.nombre_area=$2 AND (f.tipo<>'GUARDERIA' OR EXISTS(SELECT 1 FROM new_horizons.formulario_area i WHERE i.nino_id=f.nino_id AND i.tipo='GUARDERIA' AND i.estado_codigo=$3))
    AND ($4::text IS NULL OR strpos(lower(COALESCE(d.nombre_documento,'')||' '||d.categoria),lower($4))>0)
    AND ($5::text IS NULL OR d.categoria=$5)
    AND ($6::text IS NULL OR ($6='ANULADO' AND d.anulado_en IS NOT NULL) OR ($6='VIGENTE' AND d.anulado_en IS NULL))
    AND (NOT $7::boolean OR NOT EXISTS(SELECT 1 FROM new_horizons.documento_area h WHERE h.documento_anterior_id=d.id))`;
    const pagina = q.pagina || 1,
      limite = q.limite || 20,
      args = [
        id,
        area,
        process.env.FORM_CONFIRMED_STATE_CODE,
        q.buscar?.trim() || null,
        q.categoria || null,
        q.estado || null,
        q.ultimas === "true",
      ];
    const r = await this.repo.pagina(
      `SELECT d.* ${where} ORDER BY d.cargado_en DESC,d.id DESC LIMIT $8 OFFSET $9`,
      [...args, limite, (pagina - 1) * limite],
      `SELECT count(*)::int AS total ${where}`,
      args,
    );
    return {
      datos: r.filas,
      pagina,
      limite,
      total: r.total,
    };
  }
  async versiones(id: string, formularioId: string) {
    const rows = await this.repo.data.query(
      `WITH RECURSIVE anc AS (SELECT id,documento_anterior_id FROM new_horizons.documento_area WHERE id=$1 UNION SELECT d.id,d.documento_anterior_id FROM new_horizons.documento_area d JOIN anc ON d.id=anc.documento_anterior_id), raiz AS (SELECT id FROM anc WHERE documento_anterior_id IS NULL), cadena AS (SELECT d.* FROM new_horizons.documento_area d JOIN raiz r ON r.id=d.id UNION SELECT d.* FROM new_horizons.documento_area d JOIN cadena c ON d.documento_anterior_id=c.id) SELECT cadena.*,(SELECT r.motivo FROM new_horizons.revision_registro r WHERE r.tabla='documento_area' AND r.registro_id=cadena.id::text AND r.operacion='INSERT' ORDER BY r.id LIMIT 1) AS motivo_cambio,
     (SELECT e.nombre FROM new_horizons.usuario u JOIN new_horizons.empleado e ON e.id_empleado=u.id_empleado WHERE u.id_usuario=cadena.cargado_por) AS autor_nombre
     FROM cadena WHERE formulario_id=$2 ORDER BY version_documento DESC`,
      [id, formularioId],
    );
    return {
      datos: rows,
      total: rows.length,
    };
  }
  async anular(id: string, formularioId: string, dto: TransicionDto) {
    return this.repo.transaction(dto.motivo, async (manager, actor) => {
      await this.repo.formulario(formularioId, manager, true);
      const actual = await this.documento(id, manager, true);
      if (!actual) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      if (actual.anulado_en) throw new ErrorApi("DOCUMENTO_ANULADO");
      this.repo.version(actual.version_registro, dto.version);
      await manager
        .getRepository(DocumentoArea)
        .createQueryBuilder()
        .update()
        .set({
          anulado_en: () => "now()",
          anulado_por: actor,
          motivo_anulacion: dto.motivo,
        })
        .where({ id })
        .execute();
      return (await this.documento(id, manager))!;
    });
  }
}
