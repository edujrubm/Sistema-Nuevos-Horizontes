import { Module } from "@nestjs/common";
import { Persona3CoreModule } from "../persona3/persona3.module";
import { DocumentosController } from "./documentos.controller";
import { CargaPdfService } from "./carga-pdf.service";

@Module({
  imports: [Persona3CoreModule],
  controllers: [DocumentosController],
  providers: [CargaPdfService],
})
export class DocumentosModule {}
