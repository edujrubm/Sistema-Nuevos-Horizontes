import { IsOptional, IsString, Length } from "class-validator";

export class CrearFichaDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  lugar?: string;
}
