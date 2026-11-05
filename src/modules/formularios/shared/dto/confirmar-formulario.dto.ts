import { IsInt, IsString, Length, Min } from "class-validator";

export class ConfirmarFormularioDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @Length(3, 500)
  motivo!: string;
}
