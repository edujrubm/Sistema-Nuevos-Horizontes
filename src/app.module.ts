import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { DomainModule } from './modules/domain.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';
import { AlbergueModule } from './modules/albergue/albergue.module';

@Module({
  imports: [DatabaseModule, DomainModule, HealthModule, HomeModule, AlbergueModule],
})
export class AppModule {}
