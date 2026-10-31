import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { DomainModule } from './modules/domain.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';
import { AlbergueModule } from './modules/albergue/albergue.module';
import { DocumentosModule } from './modules/documentos/documentos.module';


@Module({
  imports: [DatabaseModule, DomainModule, HealthModule, HomeModule, AlbergueModule, DocumentosModule],
})
export class AppModule {}
