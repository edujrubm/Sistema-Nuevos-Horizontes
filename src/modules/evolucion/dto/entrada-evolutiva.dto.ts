import { ListaDto } from "../../../common/dto/pagina.dto";
import { TransicionDto } from "../../../common/dto/version.dto";
import { IsPgId } from "../../../common/validation/pg-id.validator";
import {
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

// Contrato existente de evolución; no cambia el DDL.
export { ListaDto } from "../../../common/dto/pagina.dto";
export class EvolucionListaDto extends ListaDto {
  @IsOptional() @IsString() @MaxLength(100) area?: string;
  @IsOptional() @IsPgId() formularioId?: string;
  @IsOptional() @IsPgId() hijoId?: string;
}
export { TransicionDto } from "../../../common/dto/version.dto";
export class CrearEntradaDto {
  @IsPgId() formularioId!: string;
  @IsString() @Matches(/\S/) @MaxLength(200) accion!: string;
  @IsString() @Matches(/\S/) @MaxLength(20000) contenido!: string;
  @IsISO8601({ strict: true })
  @Matches(/T.*(Z|[+-]\d{2}:\d{2})$/)
  fechaAtencion!: string;
  @IsPgId() profesionalId!: string;
  @IsOptional() @IsString() @MaxLength(20000) planSeguimiento?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) resultado?: string | null;
}
export class CorregirEntradaDto extends TransicionDto {
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(200) accion?: string;
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(20000) contenido?: string;
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/T.*(Z|[+-]\d{2}:\d{2})$/)
  fechaAtencion?: string;
  @IsOptional() @IsPgId() profesionalId?: string;
  @IsOptional() @IsString() @MaxLength(20000) planSeguimiento?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) resultado?: string | null;
}
