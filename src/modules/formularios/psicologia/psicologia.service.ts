import { Injectable, NotFoundException } from '@nestjs/common';

import { ListarFichasPsicologiaDto } from './dto/listar-fichas-psicologia.dto';
import { PsicologiaRepository } from './repositories/psicologia.repository';
import {
  FichaPsicologica,
  ListadoFichasPsicologia,
  ResumenBeneficiaria,
  ResumenHijo,
} from './views/psicologia.responses';

@Injectable()
export class PsicologiaService {
  constructor(private readonly psicologiaRepository: PsicologiaRepository) {}

  async obtenerResumenBeneficiaria(id: string): Promise<{ data: ResumenBeneficiaria }> {
    const resumen = await this.psicologiaRepository.buscarResumenBeneficiaria(id);

    if (!resumen) {
      throw new NotFoundException('Beneficiaria no encontrada.');
    }

    return { data: resumen };
  }

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

  async obtenerResumenHijo(id: string): Promise<{ data: ResumenHijo }> {
    const resumen = await this.psicologiaRepository.buscarResumenHijo(id);

    if (!resumen) {
      throw new NotFoundException('Niña o niño no encontrado.');
    }

    return { data: resumen };
  }

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
