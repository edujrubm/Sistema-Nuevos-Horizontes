import { Module } from "@nestjs/common";

import { AdministracionModule } from "./administracion/administracion.module";
import { AlbergueModule } from "./albergue/albergue.module";
import { AuditoriaModule } from "./auditoria/auditoria.module";
import { BeneficiariasModule } from "./beneficiarias/beneficiarias.module";
import { CatalogosModule } from "./catalogos/catalogos.module";
import { DocumentosModule } from "./documentos/documentos.module";
import { ExpedientesModule } from "./expedientes/expedientes.module";
import { FichaInicialModule } from "./ficha-inicial/ficha-inicial.module";
import { FormulariosModule } from "./formularios/formularios.module";
import { NinosModule } from "./ninos/ninos.module";
import { ReportesModule } from "./reportes/reportes.module";
import { SeguridadModule } from "./seguridad/seguridad.module";

/** Agrupa límites de dominio; los módulos no comparten repositorios directamente. */
@Module({
  imports: [
    AdministracionModule,
    AlbergueModule,
    AuditoriaModule,
    BeneficiariasModule,
    CatalogosModule,
    DocumentosModule,
    ExpedientesModule,
    FichaInicialModule,
    FormulariosModule,
    NinosModule,
    ReportesModule,
    SeguridadModule,
  ],
})
export class DomainModule {}
