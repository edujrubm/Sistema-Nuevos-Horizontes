import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from "class-validator";

export class CambiarContrasenaDto {
  @IsString()
  @IsNotEmpty()
  contrasena_actual!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12, {
    message: "La nueva contraseña debe tener al menos 12 caracteres",
  })
  @MaxLength(128)
  contrasena_nueva!: string;

  @IsString()
  @IsNotEmpty()
  confirmar_contrasena!: string;
}