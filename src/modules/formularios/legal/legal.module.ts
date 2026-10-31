import { Module } from "@nestjs/common";
import { Persona3CoreModule } from "../../persona3/persona3.module";
import { LegalController } from "./legal.controller";
@Module({ imports: [Persona3CoreModule], controllers: [LegalController] })
export class LegalModule {}
