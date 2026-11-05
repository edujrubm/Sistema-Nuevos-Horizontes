import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { ErrorApi } from "../../common/errors/error-api";
import { Persona3Repository, camel } from "../persona3/persona3.repository";
import { AmbitoLocalService } from "../persona3/ambito-local.service";
import { ListaDto, TransicionDto } from "../persona3/dto/contratos.dto";
@Injectable()
export class DocumentosService {
  constructor(
    readonly repo: Persona3Repository,
    readonly ambito: AmbitoLocalService,
  ) {}
  private async comprobar(formularioId: string) {
    const f = await this.repo.formulario(formularioId);
    const [area] = await this.repo.data.query(
      "SELECT nombre_area FROM new_horizons.area WHERE id_area=$1",
      [f.area_id],
    );
    this.ambito.comprobar(area.nombre_area);
    if (f.tipo === "GUARDERIA") {
      const [r] = await this.repo.data.query(
        "SELECT EXISTS(SELECT 1 FROM new_horizons.formulario_area WHERE nino_id=$1 AND tipo='GUARDERIA' AND estado_codigo=$2) AS inscrito",
        [f.nino_id, process.env.P3_CONFIRMED_STATE],
      );
      if (!r.inscrito) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    }
    return f;
  }
  private presentar(d: Record<string, unknown>) {
    const { objeto_privado, ...publico } = d;
    return camel(publico);
  }
  async obtener(id: string) {
    const [d] = await this.repo.data.query(
      "SELECT * FROM new_horizons.documento_area WHERE id=$1",
      [id],
    );
    if (!d) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    await this.comprobar(d.formulario_id);
    return this.presentar(d);
  }
  async listar(id: string, q: ListaDto) {
    await this.repo.expediente(id);
    const area = this.ambito.area();
    const where = `FROM new_horizons.documento_area d JOIN new_horizons.formulario_area f ON f.id=d.formulario_id JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id JOIN new_horizons.area a ON a.id_area=f.area_id WHERE e.beneficiaria_id=$1 AND a.nombre_area=$2 AND (f.tipo<>'GUARDERIA' OR EXISTS(SELECT 1 FROM new_horizons.formulario_area i WHERE i.nino_id=f.nino_id AND i.tipo='GUARDERIA' AND i.estado_codigo=$3))`;
    const pagina = q.pagina || 1,
      limite = q.limite || 20,
      args = [id, area, process.env.P3_CONFIRMED_STATE];
    const r = await this.repo.pagina(
      `SELECT d.* ${where} ORDER BY d.cargado_en DESC,d.id DESC LIMIT $4 OFFSET $5`,
      [...args, limite, (pagina - 1) * limite],
      `SELECT count(*)::int AS total ${where}`,
      args,
    );
    return {
      datos: r.filas.map((d) => this.presentar(d)),
      pagina,
      limite,
      total: r.total,
    };
  }
  async versiones(id: string) {
    const d = await this.obtener(id);
    const rows = await this.repo.data.query(
      `WITH RECURSIVE anc AS (SELECT id,documento_anterior_id FROM new_horizons.documento_area WHERE id=$1 UNION SELECT d.id,d.documento_anterior_id FROM new_horizons.documento_area d JOIN anc ON d.id=anc.documento_anterior_id), raiz AS (SELECT id FROM anc WHERE documento_anterior_id IS NULL), cadena AS (SELECT d.* FROM new_horizons.documento_area d JOIN raiz r ON r.id=d.id UNION SELECT d.* FROM new_horizons.documento_area d JOIN cadena c ON d.documento_anterior_id=c.id) SELECT * FROM cadena WHERE formulario_id=$2 ORDER BY version_documento DESC`,
      [id, d.formularioId],
    );
    return {
      datos: rows.map((r: Record<string, unknown>) => this.presentar(r)),
      total: rows.length,
    };
  }
  async anular(id: string, dto: TransicionDto) {
    this.ambito.coordinacion();
    if (!dto.motivo?.trim()) throw new ErrorApi("CAMPO_OBLIGATORIO");
    const d = await this.obtener(id);
    return this.repo.transaction(dto.motivo, async (m, actor) => {
      await this.repo.formulario(String(d.formularioId), m, true);
      const [actual] = await m.query(
        "SELECT * FROM new_horizons.documento_area WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (actual.anulado_en) throw new ErrorApi("DOCUMENTO_ANULADO");
      this.repo.version(actual.version_registro, dto.version);
      await m.query(
        "UPDATE new_horizons.documento_area SET anulado_en=now(),anulado_por=$2,motivo_anulacion=$3 WHERE id=$1",
        [id, actor, dto.motivo],
      );
      const [r] = await m.query(
        "SELECT * FROM new_horizons.documento_area WHERE id=$1",
        [id],
      );
      return this.presentar(r);
    });
  }
  async archivo(id: string) {
    const [d] = await this.repo.data.query(
      "SELECT * FROM new_horizons.documento_area WHERE id=$1",
      [id],
    );
    if (!d) throw new ErrorApi("ARCHIVO_NO_ENCONTRADO");
    await this.obtener(id);
    if (d.anulado_en) throw new ErrorApi("DOCUMENTO_ANULADO");
    const root = resolve(
        process.env.P3_DOCUMENTS_DIR || "test-results/documentos-privados",
      ),
      file = resolve(root, d.objeto_privado),
      rel = relative(root, file);
    if (!rel || rel.startsWith("..") || isAbsolute(rel))
      throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
    let bytes: Buffer;
    try {
      const realRoot = await realpath(root),
        realFile = await realpath(file),
        realRel = relative(realRoot, realFile);
      if (!realRel || realRel.startsWith("..") || isAbsolute(realRel))
        throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
      const info = await stat(file);
      if (info.size !== Number(d.tamano_bytes) || info.size > 20 * 1024 * 1024)
        throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
      bytes = await readFile(file);
    } catch (e) {
      if (e instanceof ErrorApi) throw e;
      if ((e as NodeJS.ErrnoException).code === "ENOENT")
        throw new ErrorApi("ARCHIVO_NO_ENCONTRADO");
      throw new ErrorApi("ALMACENAMIENTO_NO_DISPONIBLE");
    }
    if (createHash("sha256").update(bytes).digest("hex") !== d.sha256)
      throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
    return bytes;
  }
}
