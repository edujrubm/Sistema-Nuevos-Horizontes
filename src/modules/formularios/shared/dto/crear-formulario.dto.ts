import { IsPgId } from "../../../../common/validation/pg-id.validator";
import { IsDateString, IsObject, IsOptional, IsString } from "class-validator";

export class CrearFormularioDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @IsPgId()
  ninoId?: string;

  @IsDateString()
  fechaAtencion!: string;

  @IsPgId()
  profesionalId!: string;

  @IsObject()
  detalle!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  examenMental?: Record<string, unknown>;
}
