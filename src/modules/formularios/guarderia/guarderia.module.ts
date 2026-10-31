import { Module } from "@nestjs/common";
import { Persona3CoreModule } from "../../persona3/persona3.module";
import { GuarderiaController } from "./guarderia.controller";
@Module({ imports: [Persona3CoreModule], controllers: [GuarderiaController] })
export class GuarderiaModule {}
