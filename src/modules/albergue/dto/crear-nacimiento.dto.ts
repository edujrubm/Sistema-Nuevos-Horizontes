import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
  Matches,
} from "class-validator";

export class CrearNacimientoDto {
  @IsNotEmpty()
  @Matches(/\S/)
  @IsString()
  @MaxLength(60)
  nombre!: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaNacimiento!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/)
  cui?: string;

  @IsOptional()
  @Matches(/^[MF]$/)
  genero?: string;

  @IsOptional()
  @IsBoolean()
  reconocido?: boolean;
}
