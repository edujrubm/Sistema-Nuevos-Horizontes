import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../common/errors/error-api";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { GuarderiaResponsablesRepository } from "./repositories/guarderia-responsables.repository";
import { GuardarResponsableGuarderiaDto } from "./dto/responsable-guarderia.dto";

@Injectable()
export class GuarderiaResponsablesService {
  constructor(private readonly repository: GuarderiaResponsablesRepository) {}
  private ambito() {
    // La identidad técnica no habilita acceso en producción ni acepta área del cliente.
    if (
      !["test", "development"].includes(process.env.NODE_ENV || "") ||
      !process.env.AREA_TEST_NOMBRE
    )
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
  }
  listar(beneficiaria: string, ficha: string, filtro: ListaDto) {
    this.ambito();
    return this.repository.listar(beneficiaria, ficha, filtro);
  }
  guardar(
    beneficiaria: string,
    ficha: string,
    input: GuardarResponsableGuarderiaDto,
    responsable?: string,
  ) {
    this.ambito();
    return this.repository.guardar(beneficiaria, ficha, input, responsable);
  }
}
