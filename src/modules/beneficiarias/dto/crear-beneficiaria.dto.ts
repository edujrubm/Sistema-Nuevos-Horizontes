import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { CrearBorradorFichaDto } from "./crear-borrador-ficha.dto";
import { CrearLugarOcupacionDto } from "./crear-lugar-ocupacion.dto";
import { CrearResidenciaDto } from "./crear-residencia.dto";

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

  @IsOptional() @IsBoolean() enfermedadPermanente?: boolean;
  @IsOptional() @IsString() @Length(1, 50) nombreEnfermedad?: string;
  @IsOptional() @IsString() @Length(1, 100) tipoTratamiento?: string;
  @IsOptional() @IsString() @Length(1, 100) otrosPadecimientos?: string;
  @IsOptional() @Matches(/^\d+$/) paisCuiId?: string;
  @IsOptional() @Matches(/^\d+$/) tipoAcompananteId?: string;
  @IsOptional() @Matches(/^\d+$/) estadoCivilId?: string;
  @IsOptional() @Matches(/^\d+$/) nivelEstudioId?: string;
  @IsOptional() @Matches(/^\d+$/) estadoEstudioId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CrearLugarOcupacionDto)
  lugarOcupacion?: CrearLugarOcupacionDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CrearResidenciaDto)
  residencia?: CrearResidenciaDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => CrearBorradorFichaDto)
  fichaInicial!: CrearBorradorFichaDto;
}
