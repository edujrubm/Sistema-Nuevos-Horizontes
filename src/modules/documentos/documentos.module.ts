import { DocumentosService } from "./documentos.service";
import { Module } from "@nestjs/common";
import { RegistroAreaModule } from "../../common/registros-area/registro-area.module";
import { DocumentosController } from "./documentos.controller";
import { CargaPdfService } from "./carga-pdf.service";

@Module({
  imports: [RegistroAreaModule],
  controllers: [DocumentosController],
  providers: [CargaPdfService, DocumentosService],
})
export class DocumentosModule {}
