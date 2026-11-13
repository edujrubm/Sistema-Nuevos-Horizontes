import { Module } from "@nestjs/common";
import { FormularioAdapterRegistry } from "./formulario-adapter.registry";

/** Comparte el registro sin importar módulos concretos de atención. */
@Module({
  providers: [FormularioAdapterRegistry],
  exports: [FormularioAdapterRegistry],
})
export class FormularioExtensionesModule {}
