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
  @IsOptional() @IsString() @MaxLength(20000) tipoVivienda?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) composicionFamiliar?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) redesApoyo?: string | null;
  @IsOptional() @IsBoolean() dependenciaEconomica?: boolean | null;
  @IsOptional() @IsString() @MaxLength(20000) responsablePlan?: string | null;
  @IsOptional() @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) fechaRevision?: string | null;
  @IsOptional() @Matches(/^[1-9]\d{0,18}$/) areaCoordinacionId?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) resultadosAlcanzados?: string | null;
  @IsOptional() @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) fechaCierre?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) observaciones?: string | null;
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
