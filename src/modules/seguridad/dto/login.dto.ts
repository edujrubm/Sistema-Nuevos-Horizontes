import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre_usuario!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  contrasena!: string;
}
