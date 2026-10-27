import { Injectable, NotFoundException } from "@nestjs/common";

import { BuscarCoincidenciasDto } from "./dto/buscar-coincidencias.dto";
import { ListarBeneficiariasDto } from "./dto/listar-beneficiarias.dto";
import { BeneficiariaEntity } from "./entities/beneficiaria.entity";
import { BeneficiariasRepository } from "./repositories/beneficiarias.repository";

function enmascararCui(cui: string | null): string | null {
  if (!cui) return null;
  const limpio = cui.replace(/\s/g, "");
  return `${"*".repeat(Math.max(0, limpio.length - 4))}${limpio.slice(-4)}`;
}

function resumen(beneficiaria: BeneficiariaEntity) {
  return {
    id: beneficiaria.id,
    nombre: beneficiaria.nombre,
    fechaNacimiento: beneficiaria.fechaNacimiento,
    cuiEnmascarado: enmascararCui(beneficiaria.cui),
  };
}

@Injectable()
export class BeneficiariasService {
  constructor(private readonly repository: BeneficiariasRepository) {}

  async listar(filtros: ListarBeneficiariasDto) {
    const filas = await this.repository.listar(filtros);
    const tieneMas = filas.length > filtros.limite;
    const pagina = filas.slice(0, filtros.limite);
    return {
      data: pagina.map(resumen),
      page: {
        nextCursor: tieneMas ? (pagina.at(-1)?.id ?? null) : null,
        hasMore: tieneMas,
      },
    };
  }

  async consultar(id: string) {
    const beneficiaria = await this.repository.buscarPorId(id);
    if (!beneficiaria) {
      throw new NotFoundException("Beneficiaria no encontrada.");
    }
    const { cui, ...perfil } = beneficiaria;
    return { ...perfil, cuiEnmascarado: enmascararCui(cui) };
  }

  async buscarCoincidencias(filtros: BuscarCoincidenciasDto) {
    const filas = await this.repository.buscarCoincidencias(filtros);
    return { data: filas.map(resumen) };
  }
}
