import { EvolucionService } from "./evolucion.service";
import { Module } from "@nestjs/common";
import { RegistroAreaModule } from "../../common/registros-area/registro-area.module";
import { EvolucionController } from "./evolucion.controller";
@Module({
  imports: [RegistroAreaModule],
  providers: [EvolucionService],
  controllers: [EvolucionController],
})
export class EvolucionModule {}
