import { IsPgId } from "../../../persona3/dto/pg-id.validator";
import {
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  MaxLength,
  IsDateString,
} from "class-validator";

// Campos opcionales en borrador; obligatorios al confirmar pendientes del equipo.
export class FichaLegalDetalleDto {
  @IsOptional() @IsPgId() demandadoAgresorId?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) demandadoNombreDeclarado?:
    string | null;
  @IsOptional() @IsString() @MaxLength(20000) diagnosticoJuridico?:
    string | null;
  @IsOptional() @IsString() @MaxLength(20000) planTratamiento?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) referencia?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) inicioProcesoDescripcion?:
    string | null;
  @IsOptional() @IsString() @MaxLength(20000) juzgado?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) numeroJuicio?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) juezOficial?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) diligenciamiento?: string | null;
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  inicioProcesoFecha?: string | null;
}
