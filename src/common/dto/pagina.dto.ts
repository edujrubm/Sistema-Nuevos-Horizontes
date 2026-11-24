import { Type } from "class-transformer";
import { IsInt, Min, Max } from "class-validator";
export class ListaDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) pagina = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limite = 20;
}
