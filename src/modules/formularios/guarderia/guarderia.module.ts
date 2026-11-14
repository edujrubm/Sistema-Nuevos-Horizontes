import { PadreNinoEntity } from "./entities/padre-nino.entity";
import { GuarderiaPadresController } from "./guarderia-padres.controller";
import { GuarderiaPadresService } from "./guarderia-padres.service";
import { GuarderiaPadresRepository } from "./repositories/guarderia-padres.repository";
import { GuarderiaResponsable } from "./entities/guarderia-responsable.entity";
import { GuarderiaResponsablesRepository } from "./repositories/guarderia-responsables.repository";
import { GuarderiaResponsablesService } from "./guarderia-responsables.service";
import { GuarderiaResponsablesController } from "./guarderia-responsables.controller";
import { Module, OnModuleInit } from "@nestjs/common";
import { FormularioExtensionesModule } from "../shared/formulario-extensiones.module";
import { FormularioAdapterRegistry } from "../shared/formulario-adapter.registry";
import {
  AreaFormularioEntity,
  EstadoFormularioEntity,
  ProfesionalFormularioEntity,
} from "../shared/entities/formulario-catalogos.entity";
import { TipoFormularioEntity } from "../shared/entities/tipo-formulario.entity";
import {
  EtniaGuarderia,
  EscolaridadGuarderia,
} from "./entities/catalogos-guarderia.entity";
import { GuarderiaFormRepository } from "./repositories/guarderia-form.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExpedienteEntity } from "../../beneficiarias";
import { NinoEntity } from "../../ninos";
import { FormularioAreaEntity } from "../shared/entities/formulario-area.entity";
import { FichaGuarderia } from "./entities/ficha-guarderia.entity";
import { GuarderiaController } from "./guarderia.controller";
import { GuarderiaService } from "./guarderia.service";
import { GuarderiaRepository } from "./repositories/guarderia.repository";
@Module({
  imports: [
    FormularioExtensionesModule,
    TypeOrmModule.forFeature([
      ExpedienteEntity,
      NinoEntity,
      FormularioAreaEntity,
      FichaGuarderia,
      AreaFormularioEntity,
      EstadoFormularioEntity,
      ProfesionalFormularioEntity,
      TipoFormularioEntity,
      EtniaGuarderia,
      EscolaridadGuarderia,
      GuarderiaResponsable,
      PadreNinoEntity,
    ]),
  ],
  providers: [
    GuarderiaRepository,
    GuarderiaService,
    GuarderiaFormRepository,
    GuarderiaResponsablesRepository,
    GuarderiaResponsablesService,
    GuarderiaPadresService,
    GuarderiaPadresRepository,
  ],
  controllers: [
    GuarderiaController,
    GuarderiaResponsablesController,
    GuarderiaPadresController,
  ],
})
export class GuarderiaModule implements OnModuleInit {
  constructor(
    private readonly registro: FormularioAdapterRegistry,
    private readonly fichas: GuarderiaFormRepository,
  ) {}
  onModuleInit(): void {
    this.registro.registrar("GUARDERIA", this.fichas);
  }
}
