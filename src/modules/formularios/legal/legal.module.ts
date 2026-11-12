import { Module } from "@nestjs/common";
import { LegalController } from "./legal.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LegalService } from "./legal.service";
import { LegalRepository } from "./repositories/legal.repository";
import { FormularioAreaEntity } from "../shared/entities/formulario-area.entity";
import { ExpedienteEntity } from "../../beneficiarias/entities/expediente.entity";
import { FichaLegal } from "./entities/ficha-legal.entity";
import { ReferenciaLegal } from "./entities/referencia-legal.entity";
import { BeneficiariaEntity } from "../../beneficiarias/entities/beneficiaria.entity";
import { TipoFormularioEntity } from "../shared/entities/tipo-formulario.entity";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormularioAreaEntity,
      ExpedienteEntity,
      FichaLegal,
      ReferenciaLegal,
      BeneficiariaEntity,
      TipoFormularioEntity,
    ]),
  ],
  controllers: [LegalController],
  providers: [LegalService, LegalRepository],
})
export class LegalModule {}
