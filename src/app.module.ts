import { LaboratorioModule } from "./modules/laboratorio/laboratorio.module";
import { ErroresApiModule } from "./common/errors/errores.module";
import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module";
import { DomainModule } from "./modules/domain.module";
import { HealthModule } from "./modules/health/health.module";
import { HomeModule } from "./modules/home/home.module";

@Module({
  imports: [
    ...(process.env.P3_ENABLE_LAB === "true" &&
    ["development", "test"].includes(process.env.NODE_ENV || "development")
      ? [LaboratorioModule]
      : []),
    ErroresApiModule,
    DatabaseModule,
    DomainModule,
    HealthModule,
    HomeModule,
  ],
})
export class AppModule {}
