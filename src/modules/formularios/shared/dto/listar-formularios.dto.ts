import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class ListarFormulariosDto {
  @IsOptional()
  @Matches(/^\d+$/)
  cursor?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  areaId?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 25;
}
