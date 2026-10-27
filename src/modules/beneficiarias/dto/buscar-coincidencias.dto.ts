import {
  IsDateString,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from "class-validator";

export class BuscarCoincidenciasDto {
  @ValidateIf((dto: BuscarCoincidenciasDto) => !dto.cui)
  @IsString()
  @Length(2, 60)
  nombre?: string;

  @ValidateIf((dto: BuscarCoincidenciasDto) => !dto.nombre)
  @IsString()
  @Length(4, 20)
  cui?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  fechaNacimiento?: string;
}
