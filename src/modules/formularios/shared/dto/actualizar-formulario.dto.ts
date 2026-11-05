import {
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from "class-validator";

export class ActualizarFormularioDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @Length(3, 500)
  motivo!: string;

  @IsOptional()
  @IsDateString()
  fechaAtencion?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  profesionalId?: string;

  @IsOptional()
  @IsObject()
  detalle?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  examenMental?: Record<string, unknown>;
}
