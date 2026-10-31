import { LIMITE_PDF_BYTES } from "./limites";
import { ErrorApi, codigoTecnico } from "../../common/errors/error-api";
import { Injectable, Logger } from "@nestjs/common";
import { PDFDocument } from "pdf-lib";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { Persona3Repository } from "../persona3/persona3.repository";
import { AmbitoLocalService } from "../persona3/ambito-local.service";
import { CargaPdfDto } from "./carga-pdf.dto";

export interface ArchivoPdf {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class CargaPdfService {
  constructor(
    readonly repo: Persona3Repository,
    readonly ambito: AmbitoLocalService,
  ) {}

  async cargar(beneficiaria: string, dto: CargaPdfDto, archivo?: ArchivoPdf) {
    this.ambito.area();
    if (!archivo) throw new ErrorApi("ARCHIVO_REQUERIDO");
    if (!archivo.buffer.length) throw new ErrorApi("ARCHIVO_VACIO");
    if (archivo.buffer.length > LIMITE_PDF_BYTES)
      throw new ErrorApi("ARCHIVO_DEMASIADO_GRANDE");
    if (
      !/\.pdf$/i.test(archivo.originalname) ||
      archivo.mimetype !== "application/pdf" ||
      !archivo.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))
    ) {
      throw new ErrorApi("TIPO_ARCHIVO_NO_PERMITIDO");
    }
    try {
      const pdf = await PDFDocument.load(archivo.buffer, {
        ignoreEncryption: true,
      });
      if (pdf.isEncrypted) throw new ErrorApi("PDF_PROTEGIDO");
      if (!pdf.getPageCount()) throw new Error("PDF vacío");
    } catch (error) {
      if (error instanceof ErrorApi) throw error;
      throw new ErrorApi("PDF_INVALIDO");
    }

    const directory = resolve(
      process.env.P3_DOCUMENTS_DIR || "test-results/documentos-privados",
    );

    const key = randomUUID() + ".pdf";
    const path = resolve(directory, key);
    const sha256 = createHash("sha256").update(archivo.buffer).digest("hex");
    let archivoCreado = false;
    try {
      await mkdir(directory, { recursive: true });
      const handle = await open(path, "wx");
      archivoCreado = true;
      try {
        await handle.writeFile(archivo.buffer);
      } finally {
        await handle.close();
      }
    } catch (error) {
      if (archivoCreado)
        await unlink(path).catch(() => {
          new Logger("CargaPdf").warn(
            "Limpieza de carga incompleta pendiente; revisar almacenamiento privado.",
          );
        });
      if (
        [
          "ENOSPC",
          "ENOTDIR",
          "ENOENT",
          "EACCES",
          "EPERM",
          "EROFS",
          "EIO",
          "EMFILE",
          "ENFILE",
        ].includes(codigoTecnico(error) || "")
      )
        throw new ErrorApi("ALMACENAMIENTO_NO_DISPONIBLE");
      throw error;
    }
    try {
      return await this.repo.transaction(
        "Carga de PDF del área",
        async (m, actor) => {
          const f = await this.repo.formulario(dto.formularioId, m, true);
          if (
            f.beneficiaria_id !== beneficiaria ||
            !["SOCIAL", "LEGAL", "REFERENCIA_LEGAL", "GUARDERIA"].includes(
              f.tipo,
            )
          )
            throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
          const [area] = await m.query(
            "SELECT nombre_area FROM new_horizons.area WHERE id_area=$1",
            [f.area_id],
          );
          this.ambito.comprobar(area.nombre_area);
          if (f.tipo === "GUARDERIA") {
            const [inscripcion] = await m.query(
              "SELECT EXISTS(SELECT 1 FROM new_horizons.formulario_area WHERE nino_id=$1 AND tipo='GUARDERIA' AND estado_codigo=$2) AS inscrito",
              [f.nino_id, process.env.P3_CONFIRMED_STATE],
            );
            if (!inscripcion.inscrito)
              throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
          }
          const [doc] = await m.query(
            "INSERT INTO new_horizons.documento_area(formulario_id,categoria,objeto_privado,mime,tamano_bytes,sha256,version_documento,cargado_por) VALUES($1,$2,$3,$4,$5,$6,1,$7) RETURNING id,cargado_en",
            [
              f.id,
              dto.categoria,
              path,
              "application/pdf",
              archivo.buffer.length,
              sha256,
              actor,
            ],
          );
          return {
            id: doc.id,
            formularioId: f.id,
            areaId: f.area_id,
            expedienteId: f.expediente_id,
            categoria: dto.categoria,
            mime: "application/pdf",
            tamanoBytes: String(archivo.buffer.length),
            sha256,
            versionDocumento: 1,
            cargadoEn: doc.cargado_en,
          };
        },
      );
    } catch (error) {
      // Si se perdió la confirmación, el archivo puede tener un documento persistido: no borrarlo.
      if (!(
        error instanceof ErrorApi &&
        error.codigo === "RESULTADO_OPERACION_INCIERTO"
      )) {
        await unlink(path).catch(() => {
          new Logger("CargaPdf").warn(
            "Limpieza documental pendiente; requiere conciliación del almacenamiento privado.",
          );
        });
      }
      throw error;
    }
  }
}
