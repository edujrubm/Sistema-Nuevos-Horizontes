import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Beneficiaria } from '../../database/entities/beneficiaria.entity';

@Injectable()
export class BeneficiariasService {
  constructor(
    @InjectRepository(Beneficiaria)
    private readonly repository: Repository<Beneficiaria>,
  ) {}

  findRecent(limit = 50) {
    return this.repository.find({ take: Math.min(Math.max(limit, 1), 100), order: { id: 'DESC' } });
  }
}
