import { Module } from "@nestjs/common";
import { LegalController } from "./legal.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LegalService } from "./legal.service";
import { LegalRepository } from "./repositories/legal.repository";
import { FormularioAreaEntity } from "../shared/entities/formulario-area.entity";
import { BeneficiariaEntity, ExpedienteEntity } from "../../beneficiarias";
import { FichaLegal } from "./entities/ficha-legal.entity";
import { ReferenciaLegal } from "./entities/referencia-legal.entity";
import { TipoFormularioEntity } from "../shared/entities/tipo-formulario.entity";
import { LegalFormRepository } from "./repositories/legal-form.repository";
import {
  AreaFormularioEntity,
  EstadoFormularioEntity,
  ProfesionalFormularioEntity,
} from "../shared/entities/formulario-catalogos.entity";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormularioAreaEntity,
      ExpedienteEntity,
      FichaLegal,
      ReferenciaLegal,
      BeneficiariaEntity,
      TipoFormularioEntity,
      AreaFormularioEntity,
      EstadoFormularioEntity,
      ProfesionalFormularioEntity,
    ]),
  ],
  controllers: [LegalController],
  providers: [LegalService, LegalRepository, LegalFormRepository],
  exports: [LegalFormRepository],
})
export class LegalModule {}
