import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { IsPgId } from "../../common/validation/pg-id.validator";

export class CargaPdfDto {
  @IsPgId() formularioId!: string;
  @IsString() @Matches(/\S/) @MaxLength(200) categoria!: string;
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaDocumento?: string;
  @IsOptional() @IsString() @MaxLength(20000) descripcion?: string;
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(200)
  nombreDocumento?: string;
  @IsOptional() @IsPgId() documentoAnteriorId?: string;
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(2000)
  motivoCambio?: string;
}
