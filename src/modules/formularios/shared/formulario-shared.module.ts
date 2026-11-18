import { Module } from "@nestjs/common";

import { FormularioSharedController } from "./formulario-shared.controller";
import { FormularioSharedRepository } from "./formulario-shared.repository";
import { FormularioSharedService } from "./formulario-shared.service";
import { FormularioExtensionesModule } from "./formulario-extensiones.module";
import { BorradoresExpiradosService } from "./borradores-expirados.service";

/** Reglas de cabecera, estados, profesional y control de versión. */
@Module({
  imports: [FormularioExtensionesModule],
  controllers: [FormularioSharedController],
  providers: [
    FormularioSharedService,
    FormularioSharedRepository,
    BorradoresExpiradosService,
  ],
  exports: [FormularioSharedService],
})
export class FormularioSharedModule {}
