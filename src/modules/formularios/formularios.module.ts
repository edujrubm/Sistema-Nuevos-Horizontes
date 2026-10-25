import { Module } from '@nestjs/common';

import { FormularioSharedModule } from './shared/formulario-shared.module';
import { GuarderiaModule } from './guarderia/guarderia.module';
import { LegalModule } from './legal/legal.module';
import { MedicinaModule } from './medicina/medicina.module';
import { PsicologiaModule } from './psicologia/psicologia.module';
import { SocialModule } from './social/social.module';

/** Cabecera formulario_area y detalles especializados. */
@Module({
  imports: [FormularioSharedModule, GuarderiaModule, LegalModule, MedicinaModule, PsicologiaModule, SocialModule],
})
export class FormulariosModule {}
