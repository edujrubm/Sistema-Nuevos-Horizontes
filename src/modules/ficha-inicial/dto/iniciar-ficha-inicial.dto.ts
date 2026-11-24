import {
  IsDateString,
  IsDefined,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from "class-validator";

/** Datos mínimos de la cabecera y de la primera página de la admisión. */
export class IniciarFichaInicialDto {
  @IsDefined() @IsString() @Length(2, 60) nombre!: string;
  @ValidateIf(
    (entrada: IniciarFichaInicialDto) =>
      entrada.tipoDocumento === "DPI_CUI" || entrada.cui !== undefined,
  )
  @IsDefined()
  @Matches(/^\d{13}$/)
  cui?: string;
  @IsOptional()
  @Matches(/^(DPI_CUI|PASAPORTE|OTRO|SIN_DOCUMENTO)$/)
  tipoDocumento?: string;
  @ValidateIf(
    (entrada: IniciarFichaInicialDto) =>
      entrada.tipoDocumento === "PASAPORTE" || entrada.tipoDocumento === "OTRO",
  )
  @IsDefined()
  @IsString()
  @Length(2, 40)
  documentoAlternativo?: string;
  @ValidateIf(
    (entrada: IniciarFichaInicialDto) => entrada.tipoDocumento === "OTRO",
  )
  @IsDefined()
  @IsString()
  @Length(2, 40)
  otroTipoDocumento?: string;
  @IsOptional() @IsDateString({ strict: true }) fechaNacimiento?: string;
  @IsOptional() @Matches(/^\d+$/) paisCuiId?: string;
  @IsOptional() @Matches(/^\d+$/) tipoAcompananteId?: string;
  @IsOptional() @Matches(/^\d+$/) paisOrigenId?: string;
  @IsOptional() @Matches(/^\d+$/) departamentoOrigenId?: string;
  @IsOptional() @Matches(/^\d+$/) municipioOrigenId?: string;
  @IsOptional() @IsString() @Length(2, 100) lugar?: string;
  @IsOptional() @IsDateString({ strict: true }) fechaEntrevista?: string;
}
