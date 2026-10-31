import { IsInt, IsObject, IsString, Length, Min } from "class-validator";

export class ActualizarPaginaDto {
  @IsObject()
  secciones!: Record<string, Record<string, unknown>>;

  @IsInt()
  @Min(1)
  versionFicha!: number;

  @IsString()
  @Length(3, 500)
  motivo!: string;
}
