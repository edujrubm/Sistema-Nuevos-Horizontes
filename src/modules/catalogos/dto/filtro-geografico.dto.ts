import { IsOptional, Matches } from "class-validator";

export class FiltroPaisDto {
  @IsOptional()
  @Matches(/^\d+$/)
  paisId?: string;
}

export class FiltroDepartamentoDto {
  @IsOptional()
  @Matches(/^\d+$/)
  departamentoId?: string;
}
