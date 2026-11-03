import {
  IsDateString,
  IsDefined,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

/** Datos mínimos de la cabecera y de la primera página de la admisión. */
export class IniciarFichaInicialDto {
  @IsDefined() @IsString() @Length(2, 60) nombre!: string;
  @IsOptional() @IsString() @Length(4, 20) cui?: string;
  @IsOptional() @IsDateString({ strict: true }) fechaNacimiento?: string;
  @IsOptional() @Matches(/^\d+$/) paisCuiId?: string;
  @IsOptional() @Matches(/^\d+$/) tipoAcompananteId?: string;
  @IsOptional() @Matches(/^\d+$/) paisOrigenId?: string;
  @IsOptional() @Matches(/^\d+$/) departamentoOrigenId?: string;
  @IsOptional() @Matches(/^\d+$/) municipioOrigenId?: string;
  @IsOptional() @IsString() @Length(2, 100) lugar?: string;
  @IsOptional() @IsDateString({ strict: true }) fechaEntrevista?: string;
}
