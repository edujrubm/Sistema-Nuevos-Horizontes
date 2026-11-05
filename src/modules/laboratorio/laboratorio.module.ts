import { Module } from "@nestjs/common";
import { Persona3CoreModule } from "../persona3/persona3.module";
import { LaboratorioService } from "./laboratorio.service";
import { LaboratorioController } from "./laboratorio.controller";
@Module({
  imports: [Persona3CoreModule],
  providers: [LaboratorioService],
  controllers: [LaboratorioController],
})
export class LaboratorioModule {}
