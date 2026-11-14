import { Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  MaxLength,
  IsISO8601,
  Matches,
  IsDefined,
  IsObject,
  ValidateNested,
} from "class-validator";
import { IsPgId } from "../../../../common/validation/pg-id.validator";
import { TransicionDto } from "../../../../common/dto/version.dto";
export class DetalleReferenciaDto {
  @IsOptional() @IsString() @MaxLength(20000) destino?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) origen?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) motivoReferencia?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) recomendaciones?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) medioEntrega?: string | null;
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
  detalle!: DetalleReferenciaDto;
}
export class EditarReferenciaDto extends TransicionDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => DetalleReferenciaDto)
  detalle!: DetalleReferenciaDto;
}
export { DetalleReferenciaDto as ReferenciaLegalDetalleDto };
