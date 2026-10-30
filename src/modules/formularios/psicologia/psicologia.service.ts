import { Injectable, NotFoundException } from '@nestjs/common';

import { ListarFichasPsicologiaDto } from './dto/listar-fichas-psicologia.dto';
import { PsicologiaRepository } from './repositories/psicologia.repository';
import {
  FichaPsicologica,
  ListadoFichasPsicologia,
  ResumenBeneficiaria,
  ResumenHijo,
} from './views/psicologia.responses';

/** Orquesta las consultas y aplica la semántica HTTP del módulo. */
@Injectable()
export class PsicologiaService {
  constructor(private readonly psicologiaRepository: PsicologiaRepository) {}

  /** Obtiene un resumen minimizado y confirma que la beneficiaria exista. */
  async obtenerResumenBeneficiaria(id: string): Promise<{ data: ResumenBeneficiaria }> {
    const resumen = await this.psicologiaRepository.buscarResumenBeneficiaria(id);

    if (!resumen) {
      throw new NotFoundException('Beneficiaria no encontrada.');
    }

    return { data: resumen };
  }

  /** Consulta fichas de mujer sin mezclar formularios infantiles del expediente. */
  async obtenerFichasBeneficiaria(
    id: string,
    query: ListarFichasPsicologiaDto,
  ): Promise<ListadoFichasPsicologia> {
    const resumen = await this.psicologiaRepository.buscarResumenBeneficiaria(id);

    if (!resumen) {
      throw new NotFoundException('Beneficiaria no encontrada.');
    }

    const fichas = await this.psicologiaRepository.listarFichasBeneficiaria(
      id,
      query.limit,
      query.cursor,
    );

    return this.paginar(fichas, query.limit);
  }

  /** Obtiene un resumen infantil con el vínculo a la beneficiaria responsable. */
  async obtenerResumenHijo(id: string): Promise<{ data: ResumenHijo }> {
    const resumen = await this.psicologiaRepository.buscarResumenHijo(id);

    if (!resumen) {
      throw new NotFoundException('Niña o niño no encontrado.');
    }

    return { data: resumen };
  }

  /** Consulta exclusivamente fichas de niñez asociadas al sujeto indicado. */
  async obtenerFichasHijo(
    id: string,
    query: ListarFichasPsicologiaDto,
  ): Promise<ListadoFichasPsicologia> {
    const resumen = await this.psicologiaRepository.buscarResumenHijo(id);

    if (!resumen) {
      throw new NotFoundException('Niña o niño no encontrado.');
    }

    const fichas = await this.psicologiaRepository.listarFichasHijo(
      id,
      query.limit,
      query.cursor,
    );

    return this.paginar(fichas, query.limit);
  }

  /**
   * El repositorio solicita un elemento adicional para detectar si existe otra página.
   * Ese elemento no se expone y el último ID visible se utiliza como cursor estable.
   */
  private paginar(fichas: FichaPsicologica[], limit: number): ListadoFichasPsicologia {
    const hasMore = fichas.length > limit;
    const data = hasMore ? fichas.slice(0, limit) : fichas;

    return {
      data,
      page: {
        hasMore,
        nextCursor: hasMore ? data.at(-1)?.id ?? null : null,
      },
    };
  }
}
