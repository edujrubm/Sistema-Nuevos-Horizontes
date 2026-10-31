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
  @IsOptional() @IsString() @MaxLength(20000) relacionPartes?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) normativaAplicable?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) objetivoLegal?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) tipoJuicio?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) estadoProceso?: string | null;
  @IsOptional() @IsDateString({ strict: true }) proximaActuacionFecha?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) actuacionesRealizadas?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) acuerdosProximosPasos?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) observaciones?: string | null;
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
