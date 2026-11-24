import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../common/errors/error-api";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { GuarderiaRepository } from "./repositories/guarderia.repository";
@Injectable()
export class GuarderiaService {
  constructor(private readonly repository: GuarderiaRepository) {}
  private estadoConfirmado(): string {
    const estado = process.env.FORM_CONFIRMED_STATE_CODE;
    if (!estado) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    return estado;
  }
  listarHijos(id: string, filtro: ListaDto) {
    return this.repository.listarHijos(id, filtro, this.estadoConfirmado());
  }
  listarFichas(id: string, filtro: ListaDto) {
    return this.repository.listarFichas(id, filtro, this.estadoConfirmado());
  }
}
