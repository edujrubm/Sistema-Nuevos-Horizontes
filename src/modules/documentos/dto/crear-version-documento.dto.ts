import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CrearVersionDocumentoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  categoria!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}