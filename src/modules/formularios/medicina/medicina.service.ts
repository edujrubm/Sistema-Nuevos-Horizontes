import { Injectable, NotFoundException } from '@nestjs/common';

import { ListarFichasMedicinaDto } from './dto/listar-fichas-medicina.dto';
import { MedicinaRepository } from './repositories/medicina.repository';
import { FichaMedica, ListadoFichasMedicina } from './views/medicina.responses';

/** Orquesta las consultas y aplica la semántica HTTP del módulo. */
@Injectable()
export class MedicinaService {
  constructor(private readonly medicinaRepository: MedicinaRepository) {}

  async obtenerFichasBeneficiaria(
    id: string,
    query: ListarFichasMedicinaDto,
  ): Promise<ListadoFichasMedicina> {
    const resumen = await this.medicinaRepository.buscarResumenBeneficiaria(id);

    if (!resumen) {
      throw new NotFoundException('Beneficiaria no encontrada.');
    }

    const fichas = await this.medicinaRepository.listarFichasBeneficiaria(
      id,
      query.limit,
      query.cursor,
    );

    return this.paginar(fichas, query.limit);
  }

  async obtenerFichasHijo(
    id: string,
    query: ListarFichasMedicinaDto,
  ): Promise<ListadoFichasMedicina> {
    const resumen = await this.medicinaRepository.buscarResumenHijo(id);

    if (!resumen) {
      throw new NotFoundException('Niña o niño no encontrado.');
    }

    const fichas = await this.medicinaRepository.listarFichasHijo(
      id,
      query.limit,
      query.cursor,
    );

    return this.paginar(fichas, query.limit);
  }

  private paginar(fichas: FichaMedica[], limit: number): ListadoFichasMedicina {
    const hasMore = fichas.length > limit;
    const data = hasMore ? fichas.slice(0, limit) : fichas;

    return {
      data,
      page: {
        hasMore,
        nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
      },
    };
  }
}
