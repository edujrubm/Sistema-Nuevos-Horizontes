import { DocumentoArea } from "../entities/documento-area.entity";
import { DocumentosRepository } from "./documentos.repository";
import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../common/errors/error-api";
import { RegistroAreaRepository } from "../../../common/registros-area/registro-area.repository";
import { AmbitoLocalService } from "../../../common/registros-area/ambito-local.service";
import { CargaPdfDto } from "../carga-pdf.dto";

/** Serializa versiones de una ficha y conserva el contexto auditado en la misma transacción. */
@Injectable()
export class CargaPdfRepository {
  constructor(
    readonly repo: RegistroAreaRepository,
    readonly ambito: AmbitoLocalService,
    readonly documentos: DocumentosRepository,
  ) {}
  registrar(
    beneficiaria: string,
    dto: CargaPdfDto,
    metadata: { key: string; sha256: string; tamanoBytes: number },
  ) {
    return this.repo.transaction(
      dto.motivoCambio ?? "Carga de PDF del área",
      async (m, actor) => {
        const f = await this.repo.formulario(dto.formularioId, m, true);
        if (f.beneficiaria_id !== beneficiaria)
          throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
        const area = await this.documentos.areaNombre(f.area_id, m);
        if (!area) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
        this.ambito.comprobar(area);
        // Social adjunta la copia firmada después de confirmar la ficha.
        if (
          f.tipo === "SOCIAL" &&
          f.estado_codigo !==
            (process.env.FORM_CONFIRMED_STATE_CODE || "CONFIRMADO")
        )
          throw new ErrorApi("ESTADO_NO_PERMITIDO");
        if (f.tipo === "GUARDERIA") {
          const inscrito = await this.documentos.inscrito(f.nino_id, m);
          if (!inscrito) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
        }
        let versionDocumento = 1;
        let nombreDocumento = dto.nombreDocumento?.trim() ?? null;
        if (dto.documentoAnteriorId) {
          const anterior = await this.documentos.documento(
            dto.documentoAnteriorId,
            m,
            true,
          );
          if (
            !anterior ||
            anterior.formulario_id !== f.id ||
            anterior.anulado_en
          )
            throw new ErrorApi("RELACION_INCOMPATIBLE");
          const sucesor = await m
            .getRepository(DocumentoArea)
            .exists({ where: { documento_anterior_id: anterior.id } });
          if (sucesor) throw new ErrorApi("VERSION_DOCUMENTAL_DESACTUALIZADA");
          versionDocumento = anterior.version_documento + 1;
          nombreDocumento ??= anterior.nombre_documento;
        }
        const doc = await m.getRepository(DocumentoArea).save({
          formulario_id: f.id,
          categoria: dto.categoria,
          objeto_privado: metadata.key,
          mime: "application/pdf",
          tamano_bytes: String(metadata.tamanoBytes),
          sha256: metadata.sha256,
          version_documento: versionDocumento,
          cargado_por: actor,
          fecha_documento: dto.fechaDocumento ?? null,
          descripcion: dto.descripcion ?? null,
          nombre_documento: nombreDocumento,
          documento_anterior_id: dto.documentoAnteriorId ?? null,
        });
        return {
          id: doc.id,
          formularioId: f.id,
          areaId: f.area_id,
          expedienteId: f.expediente_id,
          categoria: dto.categoria,
          mime: "application/pdf",
          tamanoBytes: String(metadata.tamanoBytes),
          sha256: metadata.sha256,
          versionDocumento,
          nombreDocumento: doc.nombre_documento ?? dto.categoria,
          estado: "VIGENTE" as const,
          anuladoEn: null,
          versionRegistro: doc.version_registro,
          cargadoEn: doc.cargado_en,
          fechaDocumento: doc.fecha_documento,
          descripcion: doc.descripcion,
        };
      },
    );
  }
}
