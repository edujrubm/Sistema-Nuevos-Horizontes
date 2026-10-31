import { IsNotEmpty, IsNumberString } from 'class-validator';

export class CrearEstanciaDto {
  @IsNotEmpty()
  @IsNumberString()
  beneficiariaId!: string;
}
