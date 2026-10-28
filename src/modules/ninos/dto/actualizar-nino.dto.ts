import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from "class-validator";

export class ActualizarNinoDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(4, 20)
  cui?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  fechaNacimiento?: string;

  @IsOptional()
  @IsBoolean()
  reconocido?: boolean;

  @IsOptional()
  @Matches(/^[FMO]$/)
  genero?: string;

  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @Length(3, 500)
  motivo!: string;
}
