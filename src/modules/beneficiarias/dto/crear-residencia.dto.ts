import { Type } from "class-transformer";
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from "class-validator";

export class AreaResidencialDto {
  @IsOptional() @IsString() @Length(1, 25) colonia?: string;
  @IsOptional() @IsString() @Length(1, 25) barrioPopular?: string;
  @IsOptional() @IsString() @Length(1, 25) asentamiento?: string;
  @IsOptional() @IsString() @Length(1, 10) zona?: string;
  @IsOptional() @IsString() @Length(1, 25) aldea?: string;
  @IsOptional() @IsString() @Length(1, 25) caserio?: string;
  @IsOptional() @IsString() @Length(1, 25) canton?: string;
  @IsOptional() @IsString() @Length(1, 25) otro?: string;
}

export class CrearResidenciaDto {
  @IsOptional() @IsString() @Length(1, 60) direccionActual?: string;
  @IsOptional() @IsString() @Length(1, 8) numeroCasa?: string;
  @IsOptional() @IsString() @Length(1, 25) telefonoCasa?: string;
  @IsOptional() @IsString() @Length(1, 25) telefonoCelular?: string;
  @IsOptional() @IsString() @Length(1, 60) direccionAlternativa?: string;
  @IsOptional() @IsString() @Length(1, 40) personaEnlace?: string;
  @IsOptional() @IsString() @Length(1, 40) relacionPersonaEnlace?: string;
  @IsOptional() @IsBoolean() urbano?: boolean;
  @IsOptional() @Matches(/^\d+$/) paisResidenciaId?: string;
  @IsOptional() @Matches(/^\d+$/) departamentoResidenciaId?: string;
  @IsOptional() @Matches(/^\d+$/) municipioResidenciaId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AreaResidencialDto)
  areaResidencial?: AreaResidencialDto;
}
