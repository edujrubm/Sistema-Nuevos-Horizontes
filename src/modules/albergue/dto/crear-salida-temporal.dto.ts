import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CrearSalidaTemporalDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  trabajadorAsignado?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  destino!: string;
}
