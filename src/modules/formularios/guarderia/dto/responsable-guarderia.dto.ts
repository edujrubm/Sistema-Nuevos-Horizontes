import { Transform } from "class-transformer";
import { IsString, Matches, MaxLength } from "class-validator";
import { TransicionDto } from "../../../../common/dto/version.dto";
const limpiar = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;
/** Usa la versión de la ficha para serializar cualquier cambio del agregado. */
export class GuardarResponsableGuarderiaDto extends TransicionDto {
  @Transform(limpiar)
  @IsString()
  @Matches(/\S/)
  @MaxLength(200)
  nombre!: string;
  @Transform(limpiar) @IsString() @Matches(/\S/) @MaxLength(20) cui!: string;
  @Transform(limpiar)
  @IsString()
  @Matches(/\S/)
  @MaxLength(200)
  relacion!: string;
  @Transform(limpiar)
  @IsString()
  @Matches(/\S/)
  @MaxLength(25)
  telefono!: string;
}
