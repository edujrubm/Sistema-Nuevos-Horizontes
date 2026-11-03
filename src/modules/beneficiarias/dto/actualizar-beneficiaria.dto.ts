import { OmitType, PartialType } from "@nestjs/swagger";
import { IsInt, IsString, Length, Min } from "class-validator";

import { CrearBeneficiariaDto } from "./crear-beneficiaria.dto";

export class ActualizarBeneficiariaDto extends PartialType(
  OmitType(CrearBeneficiariaDto, ["fichaInicial"] as const),
) {
  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @Length(3, 500)
  motivo!: string;
}
