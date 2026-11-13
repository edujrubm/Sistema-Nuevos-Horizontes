import { SocialService } from "./social.service";
import { Module } from "@nestjs/common";
import { RegistroAreaModule } from "../../../common/registros-area/registro-area.module";
import { SocialController } from "./social.controller";
@Module({
  imports: [RegistroAreaModule],
  providers: [SocialService],
  controllers: [SocialController],
})
export class SocialModule {}
