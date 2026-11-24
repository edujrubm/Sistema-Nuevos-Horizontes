import {
  IsString,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d*$/, {
    message: "id_empleado debe ser un identificador positivo válido",
  })
  id_empleado!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(60)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      "El nombre de usuario solo permite letras, números, puntos, guiones y guiones bajos",
  })
  nombre_usuario!: string;

  @IsString()
  @MinLength(12, {
    message: "La contraseña debe tener al menos 12 caracteres",
  })
  @MaxLength(128)
  contrasena!: string;
}