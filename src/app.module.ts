import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module";
import { DomainModule } from "./modules/domain.module";
import { HealthModule } from "./modules/health/health.module";
import { HomeModule } from "./modules/home/home.module";
import { SeguridadModule } from "./modules/seguridad/seguridad.module";

@Module({
  imports: [
    DatabaseModule,
    DomainModule,
    HealthModule,
    HomeModule,
    SeguridadModule,
  ],
})
export class AppModule {}