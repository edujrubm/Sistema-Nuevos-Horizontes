import { Module } from "@nestjs/common";
import { Persona3Repository } from "./persona3.repository";
import { Persona3Service } from "./persona3.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FichaSocial } from "../formularios/social/entities/ficha-social.entity";
import { FichaLegal } from "../formularios/legal/entities/ficha-legal.entity";
import { FichaGuarderia } from "../formularios/guarderia/entities/ficha-guarderia.entity";
import { ReferenciaLegal } from "../formularios/legal/entities/referencia-legal.entity";
import { AmbitoLocalService } from "./ambito-local.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FichaSocial,
      FichaLegal,
      FichaGuarderia,
      ReferenciaLegal,
    ]),
  ],
  providers: [Persona3Repository, Persona3Service, AmbitoLocalService],
  exports: [Persona3Service, Persona3Repository, AmbitoLocalService],
})
export class Persona3CoreModule {}
