import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  ArrayMaxSize,
  IsBoolean,
  IsDefined,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
  ArrayUnique,
} from "class-validator";
import { TransicionDto } from "../persona3/dto/contratos.dto";
import { IsPgId } from "../persona3/dto/pg-id.validator";
export class DetalleLocalDto extends TransicionDto {
  @IsDefined() @IsObject() detalle!: Record<string, unknown>;
  @IsOptional() @IsPgId() fichaInicialId?: string;
}
export class RiesgosLocalDto extends TransicionDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[1-9]\d{0,18}$/, { each: true })
  riesgosIds!: string[];
}
export class ResponsableLocalDto extends TransicionDto {
  @IsString() @Matches(/\S/) @MaxLength(200) nombre!: string;
  @IsOptional() @IsString() @MaxLength(20) cui?: string;
  @IsOptional() @IsString() @MaxLength(100) telefono?: string;
  @IsOptional() @IsPgId() parentescoId?: string;
}
export class PermisoLocalDto {
  @IsPgId() familiarId!: string;
  @IsBoolean() puedeLlevar!: boolean;
  @IsBoolean() puedeRecoger!: boolean;
}
export class AutorizacionesLocalDto extends TransicionDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PermisoLocalDto)
  autorizaciones!: PermisoLocalDto[];
}
export class DocumentoLocalDto extends TransicionDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(200)
  nombreDocumento?: string;
  @IsOptional() @IsString() @MaxLength(20000) descripcion?: string;
  @IsOptional() @IsIn(["BORRADOR", "REVISADO"]) estadoRevisionCodigo?: string;
}
export class CierreLocalDto extends TransicionDto {
  @IsString()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaCierre!: string;
  @IsString() @Matches(/\S/) @MaxLength(20000) resultadosAlcanzados!: string;
}
