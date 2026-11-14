import { Injectable } from "@nestjs/common";
import { ConsultaActualRepository } from "./repositories/consulta-actual.repository";
/** Conserva el contrato público de main durante la sustitución independiente del área. */
@Injectable()
export class LegalService {
  constructor(private readonly repository: ConsultaActualRepository) {}
  fichas(...args: Parameters<ConsultaActualRepository["fichas"]>) {
    return this.repository.fichas(...args);
  }
  referencia(...args: Parameters<ConsultaActualRepository["referencia"]>) {
    return this.repository.referencia(...args);
  }
  crearReferencia(
    ...args: Parameters<ConsultaActualRepository["crearReferencia"]>
  ) {
    return this.repository.crearReferencia(...args);
  }
  editarReferencia(
    ...args: Parameters<ConsultaActualRepository["editarReferencia"]>
  ) {
    return this.repository.editarReferencia(...args);
  }
  confirmarReferencia(
    ...args: Parameters<ConsultaActualRepository["confirmarReferencia"]>
  ) {
    return this.repository.confirmarReferencia(...args);
  }
}
