import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";

export class GuardarHijoPaginaDto {
  @IsOptional() @Matches(/^\d+$/) id?: string;
  @IsOptional() @IsInt() @Min(1) version?: number;
  @IsOptional() @IsString() @Length(2, 60) nombre?: string;
  @IsOptional() @IsString() @Length(4, 20) cui?: string;
  @IsOptional() @IsDateString({ strict: true }) fechaNacimiento?: string;
  @IsOptional() @IsBoolean() reconocido?: boolean;
  @IsOptional() @Matches(/^[FMO]$/) genero?: string;
}

export class ActualizarPaginaDto {
  @IsObject()
  secciones!: Record<string, Record<string, unknown>>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardarHijoPaginaDto)
  hijos?: GuardarHijoPaginaDto[];

  @IsInt()
  @Min(1)
  versionFicha!: number;

  @IsString()
  @Length(3, 500)
  motivo!: string;
}
