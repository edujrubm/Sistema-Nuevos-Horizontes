import { LegalService } from "./legal.service";
import { Module, OnModuleInit } from "@nestjs/common";
import { RegistroAreaModule } from "../../../common/registros-area/registro-area.module";
import { FormularioExtensionesModule } from "../shared/formulario-extensiones.module";
import { FormularioAdapterRegistry } from "../shared/formulario-adapter.registry";
import { validarReferenciaCompleta } from "./validation/validar-referencia";
import { LegalController } from "./legal.controller";
import {
  ConsultaActualRepository,
  ReferenciaActualRepository,
} from "./repositories/consulta-actual.repository";
@Module({
  imports: [RegistroAreaModule, FormularioExtensionesModule],
  providers: [
    LegalService,
    ConsultaActualRepository,
    ReferenciaActualRepository,
  ],
  controllers: [LegalController],
})
export class LegalModule implements OnModuleInit {
  constructor(private readonly registro: FormularioAdapterRegistry) {}
  onModuleInit() {
    this.registro.registrarValidacion(
      "REFERENCIA_LEGAL",
      validarReferenciaCompleta,
    );
  }
}
