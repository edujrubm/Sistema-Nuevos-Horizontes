import { ErroresApiModule } from "./common/errors/errores.module";
import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module";
import { DomainModule } from "./modules/domain.module";
import { HealthModule } from "./modules/health/health.module";
import { HomeModule } from "./modules/home/home.module";

@Module({
  imports: [
    ErroresApiModule,
    DatabaseModule,
    DomainModule,
    HealthModule,
    HomeModule,
  ],
})
export class AppModule {}
