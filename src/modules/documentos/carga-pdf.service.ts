import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { PDFDocument } from "pdf-lib";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
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
    if (!archivo?.buffer?.length)
      throw new BadRequestException("Seleccione un archivo PDF");
    if (archivo.buffer.length > 20 * 1024 * 1024)
      throw new PayloadTooLargeException("Máximo 20 MiB");
    if (
      !/\.pdf$/i.test(archivo.originalname) ||
      archivo.mimetype !== "application/pdf" ||
      !archivo.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))
    ) {
      throw new BadRequestException("Solo se admite un documento PDF");
    }
    try {
      const pdf = await PDFDocument.load(archivo.buffer);
      if (!pdf.getPageCount()) throw new Error("PDF vacío");
    } catch {
      throw new BadRequestException("PDF ilegible, vacío o cifrado");
    }

    const directory = resolve(
      process.env.P3_DOCUMENTS_DIR || "test-results/documentos-privados",
    );
    await mkdir(directory, { recursive: true });
    const key = randomUUID() + ".pdf";
    const path = resolve(directory, key);
    const sha256 = createHash("sha256").update(archivo.buffer).digest("hex");
    await writeFile(path, archivo.buffer, { flag: "wx" });
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
            throw new NotFoundException(
              "Ficha no encontrada en el expediente o fuera de persona 3",
            );
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
              throw new NotFoundException("Niño no inscrito");
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
      await unlink(path).catch(() => undefined);
      throw error;
    }
  }
}
