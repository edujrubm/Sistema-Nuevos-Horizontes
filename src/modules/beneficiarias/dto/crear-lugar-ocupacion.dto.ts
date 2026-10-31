import { IsOptional, IsString, Length } from "class-validator";

export class CrearLugarOcupacionDto {
  @IsOptional() @IsString() @Length(1, 50) nombre?: string;
  @IsOptional() @IsString() @Length(1, 60) direccion?: string;
  @IsOptional() @IsString() @Length(1, 25) telefono?: string;
  @IsOptional() @IsString() @Length(1, 50) personaContacto?: string;
  @IsOptional() @IsString() @Length(1, 50) cargoPersonaContacto?: string;
}
