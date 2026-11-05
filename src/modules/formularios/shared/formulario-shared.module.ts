import { Module } from "@nestjs/common";

import { FormularioSharedController } from "./formulario-shared.controller";
import { FormularioSharedRepository } from "./formulario-shared.repository";
import { FormularioSharedService } from "./formulario-shared.service";

/** Reglas de cabecera, estados, profesional y control de versión. */
@Module({
  controllers: [FormularioSharedController],
  providers: [FormularioSharedService, FormularioSharedRepository],
  exports: [FormularioSharedService],
})
export class FormularioSharedModule {}
