import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class CrearBeneficiariaDto {
  @IsString()
  @Length(2, 60)
  nombre!: string;

  @IsOptional()
  @IsString()
  @Length(4, 20)
  cui?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  fechaNacimiento?: string;

  @IsOptional()
  @IsBoolean()
  alfabetismo?: boolean;

  @IsOptional()
  @Matches(/^\d+$/)
  paisOrigenId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  departamentoOrigenId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  municipioOrigenId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  ocupacionId?: string;
}
