import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { ListaDto } from "../../evolucion/dto/entrada-evolutiva.dto";
export class EgresoDto {
  @IsString() @Matches(/\S/) @MaxLength(2000) motivo!: string;
}
export class ConsultaEstanciasDto extends ListaDto {
  @IsOptional() @IsIn(["ACTIVAS", "FINALIZADAS", "TODAS"]) estado?: string;
  @IsOptional() @IsIn(["SITIO", "SALIDA", "TODOS"]) presencia?: string;
  @IsOptional() @IsString() @MaxLength(100) buscar?: string;
}
export class HistorialAlbergueDto extends ListaDto {
  @IsOptional()
  @IsIn(["INGRESO", "SALIDA_TEMPORAL", "RETORNO", "EGRESO", "NACIMIENTO"])
  tipo?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) desde?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) hasta?: string;
}
