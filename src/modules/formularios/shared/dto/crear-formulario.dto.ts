import {
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class CrearFormularioDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @Matches(/^\d+$/)
  ninoId?: string;

  @IsDateString()
  fechaAtencion!: string;

  @Matches(/^\d+$/)
  profesionalId!: string;

  @IsObject()
  detalle!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  examenMental?: Record<string, unknown>;
}
