import { AreaFormularioEntity } from "../formularios/shared/entities/formulario-catalogos.entity";
import { FormularioAreaEntity } from "../formularios/shared/entities/formulario-area.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentoArea } from "./entities/documento-area.entity";
import { DocumentosRepository } from "./repositories/documentos.repository";
import { CargaPdfRepository } from "./repositories/carga-pdf.repository";
import { DocumentosService } from "./documentos.service";
import { Module } from "@nestjs/common";
import { RegistroAreaModule } from "../../common/registros-area/registro-area.module";
import { DocumentosController } from "./documentos.controller";
import { CargaPdfService } from "./carga-pdf.service";

@Module({
  imports: [RegistroAreaModule, TypeOrmModule.forFeature([DocumentoArea, AreaFormularioEntity, FormularioAreaEntity])],
  controllers: [DocumentosController],
  providers: [
    CargaPdfService,
    DocumentosService,
    DocumentosRepository,
    CargaPdfRepository,
  ],
})
export class DocumentosModule {}
