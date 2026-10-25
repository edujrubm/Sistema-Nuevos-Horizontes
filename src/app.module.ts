import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [DatabaseModule, HealthModule, HomeModule],
})
export class AppModule {}
