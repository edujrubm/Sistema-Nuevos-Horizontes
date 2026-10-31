import {
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  MaxLength,
  IsDateString,
} from "class-validator";

// Campos opcionales en borrador; obligatorios al confirmar pendientes del equipo.
export class FichaGuarderiaDetalleDto {
  @IsOptional() @IsString() @MaxLength(20000) numeroFicha?: string | null;
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fechaIngreso?: string | null;
  @IsOptional() @IsString() @Matches(/^[1-9]\d{0,18}$/) etniaId?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) situacionSocioeconomica?:
    string | null;
  @IsOptional() @IsString() @MaxLength(20000) condicionVivienda?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) lugarEstudio?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) telefonoEscuela?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) enfermedadDetalle?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) tratamiento?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) observaciones?: string | null;
  @IsOptional() @IsBoolean() padeceEnfermedad?: boolean | null;
  @IsOptional() @IsString() @Matches(/^[1-9]\d{0,18}$/) escolaridadId?:
    string | null;
}
