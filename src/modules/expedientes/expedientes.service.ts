import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Expediente } from '../../database/entities/expediente.entity';

@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(Expediente)
    private readonly repository: Repository<Expediente>,
  ) {}

  async findById(id: string) {
    const expediente = await this.repository.findOne({ where: { id } });
    if (!expediente) throw new NotFoundException('Expediente no encontrado');
    return expediente;
  }
}
