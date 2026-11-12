import { Module } from "@nestjs/common";
import { Persona3CoreModule } from "../../persona3/persona3.module";
import { LegalController } from "./legal.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LegalService } from "./legal.service";
import { LegalRepository } from "./repositories/legal.repository";
import { FormularioAreaEntity } from "../shared/entities/formulario-area.entity";
import { ExpedienteEntity } from "../../beneficiarias/entities/expediente.entity";
import { FichaLegal } from "./entities/ficha-legal.entity";
import { ReferenciaLegal } from "./entities/referencia-legal.entity";
@Module({
  imports: [
    Persona3CoreModule,
    TypeOrmModule.forFeature([
      FormularioAreaEntity,
      ExpedienteEntity,
      FichaLegal,
      ReferenciaLegal,
    ]),
  ],
  controllers: [LegalController],
  providers: [LegalService, LegalRepository],
})
export class LegalModule {}
