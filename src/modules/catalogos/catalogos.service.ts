import { Injectable, NotFoundException } from "@nestjs/common";

import {
  CATALOGOS_PERMITIDOS,
  CatalogosRepository,
} from "./repositories/catalogos.repository";

@Injectable()
export class CatalogosService {
  constructor(private readonly repository: CatalogosRepository) {}

  async paises() {
    return { data: await this.repository.paises() };
  }

  async departamentos(paisId?: string) {
    return { data: await this.repository.departamentos(paisId) };
  }

  async municipios(departamentoId?: string) {
    return { data: await this.repository.municipios(departamentoId) };
  }

  async obtener(tipo: string) {
    const definicion = CATALOGOS_PERMITIDOS[tipo];
    if (!definicion)
      throw new NotFoundException("Tipo de catálogo no permitido.");
    return { data: await this.repository.catalogo(definicion) };
  }
}
