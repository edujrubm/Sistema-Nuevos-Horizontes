import { Injectable } from "@nestjs/common";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { SocialRepository } from "./repositories/social.repository";
import { SocialResumenRepository } from "./repositories/social-resumen.repository";

/** Casos de uso propios de Trabajo Social; persistencia encapsulada en el repositorio. */
@Injectable()
export class SocialService {
  constructor(
    private readonly repository: SocialRepository,
    private readonly resumenRepository: SocialResumenRepository,
  ) {}

  consultarResumen(beneficiariaId: string) {
    return this.resumenRepository.consultar(beneficiariaId);
  }

  listarFichas(beneficiariaId: string, filtro: ListaDto) {
    return this.repository.listar(beneficiariaId, filtro.pagina, filtro.limite);
  }
}
