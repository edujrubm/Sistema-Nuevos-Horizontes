import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { BuscarCoincidenciasDto } from "../dto/buscar-coincidencias.dto";
import { ListarBeneficiariasDto } from "../dto/listar-beneficiarias.dto";
import { BeneficiariaEntity } from "../entities/beneficiaria.entity";

@Injectable()
export class BeneficiariasRepository {
  constructor(
    @InjectRepository(BeneficiariaEntity)
    private readonly repository: Repository<BeneficiariaEntity>,
  ) {}

  async listar(filtros: ListarBeneficiariasDto): Promise<BeneficiariaEntity[]> {
    const consulta = this.repository
      .createQueryBuilder("beneficiaria")
      .orderBy("beneficiaria.id_beneficiaria", "ASC")
      .take(filtros.limite + 1);

    if (filtros.cursor) {
      consulta.andWhere("beneficiaria.id_beneficiaria > :cursor", {
        cursor: filtros.cursor,
      });
    }
    if (filtros.nombre?.trim()) {
      consulta.andWhere("beneficiaria.nombre ILIKE :nombre", {
        nombre: `%${filtros.nombre.trim()}%`,
      });
    }
    return consulta.getMany();
  }

  buscarPorId(id: string): Promise<BeneficiariaEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async buscarCoincidencias(
    filtros: BuscarCoincidenciasDto,
  ): Promise<BeneficiariaEntity[]> {
    const consulta = this.repository
      .createQueryBuilder("beneficiaria")
      .orderBy("beneficiaria.id_beneficiaria", "ASC")
      .take(20);

    if (filtros.cui?.trim()) {
      consulta.andWhere(
        "regexp_replace(coalesce(beneficiaria.cui, ''), '[^0-9]', '', 'g') = :cui",
        {
          cui: filtros.cui.replace(/\D/g, ""),
        },
      );
    }
    if (filtros.nombre?.trim()) {
      consulta.andWhere("beneficiaria.nombre ILIKE :nombre", {
        nombre: `%${filtros.nombre.trim()}%`,
      });
    }
    if (filtros.fechaNacimiento) {
      consulta.andWhere("beneficiaria.fecha_nac = :fechaNacimiento", {
        fechaNacimiento: filtros.fechaNacimiento,
      });
    }
    return consulta.getMany();
  }
}
