import { GuarderiaService } from "./guarderia.service";
import { Module } from "@nestjs/common";
import { RegistroAreaModule } from "../../../common/registros-area/registro-area.module";
import { GuarderiaController } from "./guarderia.controller";
@Module({
  imports: [RegistroAreaModule],
  providers: [GuarderiaService],
  controllers: [GuarderiaController],
})
export class GuarderiaModule {}
