import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../common/errors/error-api";
import { ListaDto } from "../../../common/dto/pagina.dto";
import { GuarderiaPadresRepository } from "./repositories/guarderia-padres.repository";
import {
  CrearPadreGuarderiaDto,
  EditarPadreGuarderiaDto,
} from "./dto/padre-guarderia.dto";
@Injectable()
export class GuarderiaPadresService {
  constructor(private readonly repo: GuarderiaPadresRepository) {}
  private comprobarAmbito() {
    // Identidad técnica exclusiva del laboratorio; falla cerrado en producción.
    if (
      !["development", "test"].includes(process.env.NODE_ENV || "") ||
      !process.env.AREA_TEST_NOMBRE
    )
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    if (process.env.AREA_TEST_NOMBRE !== "Guardería")
      throw new ErrorApi("AREA_NO_AUTORIZADA");
  }
  listar(beneficiariaId: string, ninoId: string, filtro: ListaDto) {
    this.comprobarAmbito();
    return this.repo.listar(beneficiariaId, ninoId, filtro);
  }
  crear(beneficiariaId: string, ninoId: string, dto: CrearPadreGuarderiaDto) {
    this.comprobarAmbito();
    return this.repo.crear(beneficiariaId, ninoId, dto);
  }
  editar(
    beneficiariaId: string,
    ninoId: string,
    id: string,
    dto: EditarPadreGuarderiaDto,
  ) {
    this.comprobarAmbito();
    return this.repo.editar(beneficiariaId, ninoId, id, dto);
  }
}
