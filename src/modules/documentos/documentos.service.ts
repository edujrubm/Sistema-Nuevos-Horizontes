import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { ErrorApi } from "../../common/errors/error-api";
import {
  RegistroAreaRepository,
  camel,
} from "../../common/registros-area/registro-area.repository";
import { AmbitoLocalService } from "../../common/registros-area/ambito-local.service";
import { TransicionDto } from "../../common/dto/version.dto";
import { DocumentosRepository } from "./repositories/documentos.repository";
import { DocumentosListaDto } from "./documentos-lista.dto";
@Injectable()
export class DocumentosService {
  constructor(
    readonly repo: RegistroAreaRepository,
    readonly ambito: AmbitoLocalService,
    readonly repository: DocumentosRepository,
  ) {}
  private async comprobar(formularioId: string) {
    const f = await this.repo.formulario(formularioId);
    const area = await this.repository.areaNombre(f.area_id);
    if (!area) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    this.ambito.comprobar(area);
    if (f.tipo === "GUARDERIA") {
      const inscrito = await this.repository.inscrito(f.nino_id);
      if (!inscrito) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    }
    return f;
  }
  private presentar(d: Record<string, unknown>) {
    const { objeto_privado, ...publico } = d;
    return camel(publico);
  }
  async obtener(id: string) {
    const d = await this.repository.documento(id);
    if (!d) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    await this.comprobar(d.formulario_id);
    return this.presentar({ ...d });
  }
  async contexto(id: string) {
    await this.repo.expediente(id);
    const area = this.ambito.area();
    return {
      ...(await this.repository.contexto(id, area)),
      area,
      capacidades: {
        cargar: true,
        anular: process.env.AREA_TEST_ROL === "COORDINACION",
      },
    };
  }
  async listar(id: string, q: DocumentosListaDto) {
    await this.repo.expediente(id);
    const result = await this.repository.listar(id, q, this.ambito.area());
    return {
      ...result,
      datos: result.datos.map((d) => this.presentar({ ...d })),
    };
  }
  async versiones(id: string) {
    const d = await this.obtener(id);
    const result = await this.repository.versiones(id, String(d.formularioId));
    return {
      ...result,
      datos: result.datos.map((row: Record<string, unknown>) =>
        this.presentar(row),
      ),
    };
  }
  async anular(id: string, dto: TransicionDto) {
    this.ambito.coordinacion();
    if (!dto.motivo?.trim()) throw new ErrorApi("CAMPO_OBLIGATORIO");
    const d = await this.obtener(id);
    return this.presentar({
      ...(await this.repository.anular(id, String(d.formularioId), dto)),
    });
  }
  async archivo(id: string) {
    const d = await this.repository.documento(id);
    if (!d) throw new ErrorApi("ARCHIVO_NO_ENCONTRADO");
    await this.obtener(id);
    if (d.anulado_en) throw new ErrorApi("DOCUMENTO_ANULADO");
    const root = resolve(
        process.env.DOCUMENTOS_DIR || "test-results/documentos-privados",
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
