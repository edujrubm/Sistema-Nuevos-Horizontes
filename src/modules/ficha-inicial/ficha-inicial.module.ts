import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FichaInicialEntity } from "./entities/ficha-inicial.entity";
import { FichaSeccionEntity } from "./entities/ficha-seccion.entity";
import { FichaInicialController } from "./ficha-inicial.controller";
import { FichaInicialService } from "./ficha-inicial.service";
import { FichaInicialRepository } from "./repositories/ficha-inicial.repository";

@Module({
  imports: [TypeOrmModule.forFeature([FichaInicialEntity, FichaSeccionEntity])],
  controllers: [FichaInicialController],
  providers: [FichaInicialService, FichaInicialRepository],
})
export class FichaInicialModule {}
