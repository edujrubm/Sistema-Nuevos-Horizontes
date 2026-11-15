import { Injectable } from "@nestjs/common";
import { ConsultaActualRepository } from "./repositories/consulta-actual.repository";
/** Conserva el contrato público de main durante la sustitución independiente del área. */
@Injectable()
export class SocialService {
  constructor(private readonly repository: ConsultaActualRepository) {}
  fichas(...args: Parameters<ConsultaActualRepository["fichas"]>) {
    return this.repository.fichas(...args);
  }
  resumenSocial(
    ...args: Parameters<ConsultaActualRepository["resumenSocial"]>
  ) {
    return this.repository.resumenSocial(...args);
  }
}
