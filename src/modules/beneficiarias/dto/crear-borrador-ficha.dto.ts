import {
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

export class CrearBorradorFichaDto {
  @IsOptional() @IsString() @Length(2, 100) lugar?: string;
  @IsOptional() @IsDateString({ strict: true }) fechaEntrevista?: string;

  @IsOptional()
  @IsObject()
  seccionesIniciales?: Record<string, Record<string, unknown>>;
}
