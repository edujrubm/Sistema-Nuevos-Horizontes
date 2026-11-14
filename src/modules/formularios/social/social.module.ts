import { SocialService } from "./social.service";
import { Module } from "@nestjs/common";
import { RegistroAreaModule } from "../../../common/registros-area/registro-area.module";
import { SocialController } from "./social.controller";
import { ConsultaActualRepository } from "./repositories/consulta-actual.repository";
@Module({
  imports: [RegistroAreaModule],
  providers: [SocialService, ConsultaActualRepository],
  controllers: [SocialController],
})
export class SocialModule {}
