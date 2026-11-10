import { Transform } from "class-transformer";
import { IsInt, IsString, Length, Matches, Min } from "class-validator";

export class DescartarFormularioDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Length(3, 500)
  @Matches(/\S/, { message: "El motivo no puede contener solo espacios." })
  motivo!: string;
}
