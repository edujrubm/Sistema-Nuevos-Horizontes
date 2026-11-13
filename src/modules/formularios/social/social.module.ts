import { Module, OnModuleInit } from "@nestjs/common";
import { SocialController } from "./social.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BeneficiariaEntity, ExpedienteEntity } from "../../beneficiarias";
import { EvolucionLecturaModule } from "../../evolucion/lectura";
import { AreaFormularioEntity, EstadoFormularioEntity, ProfesionalFormularioEntity } from "../shared/entities/formulario-catalogos.entity";
import { TipoFormularioEntity } from "../shared/entities/tipo-formulario.entity";
import { FormularioExtensionesModule } from "../shared/formulario-extensiones.module";
import { FormularioAdapterRegistry } from "../shared/formulario-adapter.registry";
import { FormularioAreaEntity } from "../shared/entities/formulario-area.entity";
import { FichaSocial } from "./entities/ficha-social.entity";
import { SocialService } from "./social.service";
import { SocialRepository } from "./repositories/social.repository";
import { SocialResumenRepository } from "./repositories/social-resumen.repository";
import { SocialFormRepository } from "./repositories/social-form.repository";

@Module({
  imports: [FormularioExtensionesModule, EvolucionLecturaModule, TypeOrmModule.forFeature([
    BeneficiariaEntity, ExpedienteEntity, FormularioAreaEntity, FichaSocial, ProfesionalFormularioEntity,
    AreaFormularioEntity, EstadoFormularioEntity, TipoFormularioEntity,
  ])],
  controllers: [SocialController],
  providers: [SocialService, SocialRepository, SocialResumenRepository, SocialFormRepository],
  exports: [SocialService],
})
export class SocialModule implements OnModuleInit {
  constructor(private readonly registro: FormularioAdapterRegistry, private readonly fichas: SocialFormRepository) {}

  onModuleInit(): void {
    this.registro.registrar("SOCIAL", this.fichas);
  }
}
