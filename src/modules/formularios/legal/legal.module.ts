import { Module, OnModuleInit } from "@nestjs/common";
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
import { FormularioAdapterRegistry } from "../shared/formulario-adapter.registry";
import { FormularioExtensionesModule } from "../shared/formulario-extensiones.module";
import { validarReferenciaCompleta } from "./validation/validar-referencia";

@Module({
  imports: [
    FormularioExtensionesModule,
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
  exports: [LegalService],
})
export class LegalModule implements OnModuleInit {
  constructor(
    private readonly registro: FormularioAdapterRegistry,
    private readonly fichas: LegalFormRepository,
  ) {}

  /** Registra las extensiones del área sin introducir dependencias inversas. */
  onModuleInit(): void {
    this.registro.registrar("LEGAL", this.fichas);
    this.registro.registrarValidacion(
      "REFERENCIA_LEGAL",
      validarReferenciaCompleta,
    );
  }
}
