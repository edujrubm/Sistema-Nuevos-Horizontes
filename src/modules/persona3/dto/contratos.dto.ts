import { IsPgId } from "./pg-id.validator";
import { Type } from "class-transformer";
import {
  IsDefined,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

// Contrato provisional camelCase: sujeto a revisión del equipo, no cambia el DDL.
export class ListaDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) pagina = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limite = 20;
}
export class EvolucionListaDto extends ListaDto {
  @IsOptional() @IsString() @MaxLength(100) area?: string;
  @IsOptional() @IsPgId() formularioId?: string;
  @IsOptional() @IsPgId() hijoId?: string;
}
export class DetalleReferenciaDto {
  @IsOptional() @IsString() @MaxLength(20000) destino?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) origen?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) motivoReferencia?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) recomendaciones?: string | null;
}
export class CrearReferenciaDto {
  @IsISO8601({ strict: true })
  @Matches(/T.*(Z|[+-]\d{2}:\d{2})$/)
  fechaAtencion!: string;
  @IsPgId() profesionalId!: string;
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => DetalleReferenciaDto)
  detalle: DetalleReferenciaDto = new DetalleReferenciaDto();
}
export class TransicionDto {
  @IsInt() @Min(1) version!: number;
  @IsString() @Matches(/\S/) @MaxLength(2000) motivo!: string;
}
export class EditarReferenciaDto extends TransicionDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => DetalleReferenciaDto)
  detalle!: DetalleReferenciaDto;
}
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
