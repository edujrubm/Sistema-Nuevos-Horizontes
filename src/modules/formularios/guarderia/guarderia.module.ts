import { GuarderiaService } from "./guarderia.service";
import { Module } from "@nestjs/common";
import { RegistroAreaModule } from "../../../common/registros-area/registro-area.module";
import { GuarderiaController } from "./guarderia.controller";
import { ConsultaActualRepository } from "./repositories/consulta-actual.repository";
@Module({
  imports: [RegistroAreaModule],
  providers: [GuarderiaService, ConsultaActualRepository],
  controllers: [GuarderiaController],
})
export class GuarderiaModule {}
