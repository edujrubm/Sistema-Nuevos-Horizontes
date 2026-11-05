import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NinoEntity } from "./entities/nino.entity";
import { NinosController } from "./ninos.controller";
import { NinosRepository } from "./repositories/ninos.repository";
import { NinosService } from "./ninos.service";

@Module({
  imports: [TypeOrmModule.forFeature([NinoEntity])],
  controllers: [NinosController],
  providers: [NinosService, NinosRepository],
})
export class NinosModule {}
