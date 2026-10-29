import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class ListarFichasPsicologiaDto {
  @IsOptional()
  @Matches(/^[1-9]\d*$/, { message: 'cursor debe ser un identificador válido.' })
  cursor?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
