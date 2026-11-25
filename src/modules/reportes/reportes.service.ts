import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  CAMPOS_OTROS_FICHA,
  campoEtiquetaReporteriaOtro,
  campoNormalizadoOtro,
  esCampoOtroFicha,
  normalizarTextoOtro,
} from "../ficha-inicial/normalizacion-otros";
import { ActualizarEtiquetaOtroDto } from "./dto/actualizar-etiqueta-otro.dto";

interface SeccionFichaRow {
  id: string;
  seccion: string;
  contenido: Record<string, unknown>;
}

@Injectable()
export class ReportesService {
  constructor(private readonly dataSource: DataSource) {}

  async listarValoresOtros() {
    const secciones = Object.keys(CAMPOS_OTROS_FICHA);
    const rows = await this.dataSource.query<SeccionFichaRow[]>(
      `SELECT id::text,seccion,contenido
       FROM new_horizons.ficha_inicial_seccion
       WHERE seccion=ANY($1::text[])`,
      [secciones],
    );
    const grupos = new Map<
      string,
      {
        seccion: string;
        campo: string;
        valorNormalizado: string;
        etiquetaReporteria: string | null;
        vecesObservado: number;
        variantes: Set<string>;
      }
    >();
    for (const row of rows) {
      for (const campo of CAMPOS_OTROS_FICHA[row.seccion] ?? []) {
        const original = row.contenido[campo];
        if (typeof original !== "string") continue;
        const valorNormalizado = normalizarTextoOtro(original);
        if (!valorNormalizado) continue;
        const key = `${row.seccion}\u0000${campo}\u0000${valorNormalizado}`;
        const etiqueta = row.contenido[campoEtiquetaReporteriaOtro(campo)];
        const grupo = grupos.get(key) ?? {
          seccion: row.seccion,
          campo,
          valorNormalizado,
          etiquetaReporteria: null,
          vecesObservado: 0,
          variantes: new Set<string>(),
        };
        grupo.vecesObservado += 1;
        grupo.variantes.add(original);
        if (typeof etiqueta === "string" && etiqueta.trim())
          grupo.etiquetaReporteria = etiqueta;
        grupos.set(key, grupo);
      }
    }
    const data = [...grupos.values()]
      .map((grupo) => ({
        ...grupo,
        variantes: [...grupo.variantes],
      }))
      .sort((a, b) =>
        `${a.seccion}\u0000${a.campo}\u0000${a.valorNormalizado}`.localeCompare(
          `${b.seccion}\u0000${b.campo}\u0000${b.valorNormalizado}`,
          "es-GT",
        ),
      );
    return { data };
  }

  async actualizarEtiqueta(
    entrada: ActualizarEtiquetaOtroDto,
    administradorId: string,
  ) {
    if (!esCampoOtroFicha(entrada.seccion, entrada.campo))
      throw new BadRequestException(
        "El campo indicado no corresponde a una opción Otra u Otros de Ficha Inicial.",
      );
    const valorNormalizado = normalizarTextoOtro(entrada.valorNormalizado);
    const campoNormalizado = campoNormalizadoOtro(entrada.campo);
    const campoEtiqueta = campoEtiquetaReporteriaOtro(entrada.campo);
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT set_config('new_horizons.actor_id',$1,true),
                set_config('new_horizons.motivo',$2,true)`,
        [administradorId, "Corrección de etiqueta para reportería"],
      );
      const candidatas = await manager.query<SeccionFichaRow[]>(
        `SELECT id::text,seccion,contenido
         FROM new_horizons.ficha_inicial_seccion
         WHERE seccion=$1
         FOR UPDATE`,
        [entrada.seccion],
      );
      const coincidentes = candidatas.filter((row) => {
        const original = row.contenido[entrada.campo];
        return (
          typeof original === "string" &&
          normalizarTextoOtro(original) === valorNormalizado
        );
      });
      for (const row of coincidentes) {
        await manager.query(
          `UPDATE new_horizons.ficha_inicial_seccion
           SET contenido=$2::jsonb
           WHERE id=$1::bigint`,
          [
            row.id,
            JSON.stringify({
              ...row.contenido,
              [campoNormalizado]: valorNormalizado,
              [campoEtiqueta]: entrada.etiqueta.trim(),
            }),
          ],
        );
      }
      if (!coincidentes.length)
        throw new NotFoundException(
          "No se encontraron fichas con el valor normalizado indicado.",
        );
      return {
        data: {
          seccion: entrada.seccion,
          campo: entrada.campo,
          valorNormalizado,
          etiquetaReporteria: entrada.etiqueta.trim(),
          fichasActualizadas: coincidentes.length,
        },
      };
    });
  }
}
