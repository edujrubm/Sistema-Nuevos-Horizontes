import { Injectable } from "@nestjs/common";
import { ConsultaActualRepository } from "./repositories/consulta-actual.repository";
/** Conserva el contrato público de main durante la sustitución independiente del área. */
@Injectable()
export class GuarderiaService {
  constructor(private readonly repository: ConsultaActualRepository) {}
  fichas(...args: Parameters<ConsultaActualRepository["fichas"]>) {
    return this.repository.fichas(...args);
  }
  hijos(...args: Parameters<ConsultaActualRepository["hijos"]>) {
    return this.repository.hijos(...args);
  }
}
