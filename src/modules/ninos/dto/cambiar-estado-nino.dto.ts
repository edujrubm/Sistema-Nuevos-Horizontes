import { IsInt, IsString, Length, Min } from "class-validator";

export class CambiarEstadoNinoDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @Length(3, 500)
  motivo!: string;
}
