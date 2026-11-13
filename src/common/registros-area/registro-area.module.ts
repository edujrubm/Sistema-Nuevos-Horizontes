import { Module } from "@nestjs/common";
import { RegistroAreaRepository } from "./registro-area.repository";
import { AmbitoLocalService } from "./ambito-local.service";

/** Infraestructura compartida; las operaciones de negocio viven en cada módulo. */
@Module({
  providers: [RegistroAreaRepository, AmbitoLocalService],
  exports: [RegistroAreaRepository, AmbitoLocalService],
})
export class RegistroAreaModule {}
