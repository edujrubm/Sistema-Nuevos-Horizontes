import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class CrearNinoDto {
  @IsString()
  @Length(2, 60)
  nombre!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/)
  cui?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  fechaNacimiento?: string;

  @IsOptional()
  @IsBoolean()
  reconocido?: boolean;

  @IsOptional()
  @Matches(/^[FMO]$/)
  genero?: string;
}
