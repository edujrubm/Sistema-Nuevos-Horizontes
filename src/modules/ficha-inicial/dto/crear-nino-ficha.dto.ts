import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class CrearNinoFichaDto {
  @IsString() @Length(2, 60) nombre!: string;
  @IsOptional() @IsString() @Length(4, 20) cui?: string;
  @IsOptional() @IsDateString({ strict: true }) fechaNacimiento?: string;
  @IsOptional() @IsBoolean() reconocido?: boolean;
  @IsOptional() @Matches(/^[FMO]$/) genero?: string;
}
