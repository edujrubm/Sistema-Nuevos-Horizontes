import { IsString, Length, Matches } from "class-validator";

export class ActualizarEtiquetaOtroDto {
  @IsString()
  @Length(1, 60)
  seccion!: string;

  @IsString()
  @Length(1, 80)
  campo!: string;

  @IsString()
  @Length(1, 2000)
  valorNormalizado!: string;

  @IsString()
  @Length(1, 200)
  @Matches(/\S/, { message: "La etiqueta debe contener texto." })
  etiqueta!: string;
}
