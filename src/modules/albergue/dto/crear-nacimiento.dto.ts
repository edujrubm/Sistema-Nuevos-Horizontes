import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class CrearNacimientoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(60)
  nombre!: string;

  @IsDateString()
  fechaNacimiento!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cui?: string;

  @IsOptional()
  @Matches(/^[MF]$/)
  genero?: string;

  @IsOptional()
  @IsBoolean()
  reconocido?: boolean;
}
