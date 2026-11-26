import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  CAMPOS_OTROS_FICHA,
  esCampoOtroFicha,
  normalizarTextoOtro,
} from "../ficha-inicial/normalizacion-otros";
import { ActualizarEtiquetaOtroDto } from "./dto/actualizar-etiqueta-otro.dto";

interface SeccionFichaRow {
  id: string;
  seccion: string;
  contenido: Record<string, unknown>;
}

interface ValorOtroRow {
  seccion: string;
  campo: string;
  valorNormalizado: string;
  etiquetaReporteria: string | null;
}

@Injectable()
export class ReportesService {
  constructor(private readonly dataSource: DataSource) {}

  async listarValoresOtros() {
    const secciones = Object.keys(CAMPOS_OTROS_FICHA);
    const [catalogo, rows] = await Promise.all([
      this.dataSource.query<ValorOtroRow[]>(
        `SELECT seccion,campo,valor_normalizado AS "valorNormalizado",
                etiqueta_reporteria AS "etiquetaReporteria"
         FROM new_horizons.valor_otro_ficha_inicial`,
      ),
      this.dataSource.query<SeccionFichaRow[]>(
        `SELECT id::text,seccion,contenido
       FROM new_horizons.ficha_inicial_seccion
       WHERE seccion=ANY($1::text[])`,
        [secciones],
      ),
    ]);
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
        const etiqueta = catalogo.find(
          (item) =>
            item.seccion === row.seccion &&
            item.campo === campo &&
            item.valorNormalizado === valorNormalizado,
        )?.etiquetaReporteria;
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
    // Incluye también valores ya catalogados que dejaron de aparecer en fichas
    // activas, sin duplicar las variantes observadas actualmente.
    for (const item of catalogo) {
      const key = `${item.seccion}\u0000${item.campo}\u0000${item.valorNormalizado}`;
      if (!grupos.has(key))
        grupos.set(key, {
          ...item,
          vecesObservado: 0,
          variantes: new Set<string>(),
        });
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
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT set_config('new_horizons.actor_id',$1,true),
                set_config('new_horizons.motivo',$2,true)`,
        [administradorId, "Corrección de etiqueta para reportería"],
      );
      const actualizadas = await manager.query<Array<{ id: string }>>(
        `UPDATE new_horizons.valor_otro_ficha_inicial
         SET etiqueta_reporteria=$4,actualizado_por=$5::bigint,
             actualizado_en=clock_timestamp(),version=version+1
         WHERE seccion=$1 AND campo=$2 AND valor_normalizado=$3
         RETURNING id::text`,
        [
          entrada.seccion,
          entrada.campo,
          valorNormalizado,
          entrada.etiqueta.trim(),
          administradorId,
        ],
      );
      if (!actualizadas.length)
        throw new NotFoundException(
          "No se encontró el valor normalizado indicado.",
        );
      const [{ total }] = await manager.query<Array<{ total: string }>>(
        `SELECT count(*)::text AS total
         FROM new_horizons.ficha_inicial_seccion
         WHERE seccion=$1 AND contenido ? $2
           AND new_horizons.normalizar_valor_otro(contenido ->> $2)=$3`,
        [entrada.seccion, entrada.campo, valorNormalizado],
      );
      return {
        data: {
          seccion: entrada.seccion,
          campo: entrada.campo,
          valorNormalizado,
          etiquetaReporteria: entrada.etiqueta.trim(),
          fichasActualizadas: Number(total),
        },
      };
    });
  }
}
