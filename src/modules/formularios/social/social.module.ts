import { Module } from "@nestjs/common";
import { Persona3CoreModule } from "../../persona3/persona3.module";
import { SocialController } from "./social.controller";
@Module({ imports: [Persona3CoreModule], controllers: [SocialController] })
export class SocialModule {}
