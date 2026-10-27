import { Transform } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class ListarBeneficiariasDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 25;

  @IsOptional()
  @IsString()
  nombre?: string;
}
