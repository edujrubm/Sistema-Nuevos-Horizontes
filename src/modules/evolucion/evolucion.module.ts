import { Module } from "@nestjs/common";
import { Persona3CoreModule } from "../persona3/persona3.module";
import { EvolucionController } from "./evolucion.controller";
@Module({ imports: [Persona3CoreModule], controllers: [EvolucionController] })
export class EvolucionModule {}
