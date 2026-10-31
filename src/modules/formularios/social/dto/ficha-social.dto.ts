import {
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  MaxLength,
  IsDateString,
} from "class-validator";

// Campos opcionales en borrador; obligatorios al confirmar pendientes del equipo.
export class FichaSocialDetalleDto {
  @IsOptional() @IsString() @MaxLength(20000) historiaViolencia?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) diagnosticoSocial?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) riesgosIdentificados?:
    string | null;
  @IsOptional() @IsString() @MaxLength(20000) planEliminacionRiesgos?:
    string | null;
  @IsOptional() @IsString() @MaxLength(20000) objetivoGeneral?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) actividades?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) evaluacion?: string | null;
}
