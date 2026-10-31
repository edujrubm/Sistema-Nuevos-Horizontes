import {
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  MaxLength,
  IsDateString,
} from "class-validator";

// Campos opcionales en borrador; obligatorios al confirmar pendientes del equipo.
export class ReferenciaLegalDetalleDto {
  @IsOptional() @IsString() @MaxLength(20000) destino?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) origen?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) motivoReferencia?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) recomendaciones?: string | null;
}
