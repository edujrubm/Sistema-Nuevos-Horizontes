import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from "class-validator";

export class ListarFichasDto {
  @IsOptional() @Matches(/^\d+$/) cursor?: string;
  @IsOptional() @IsIn(["BORRADOR", "CONFIRMADA", "DESCARTADA"]) estado?:
    "BORRADOR" | "CONFIRMADA" | "DESCARTADA";
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limite = 25;
}
