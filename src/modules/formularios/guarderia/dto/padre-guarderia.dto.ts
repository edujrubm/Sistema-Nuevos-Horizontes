import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
const limpiar = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() || null : value;
export class CrearPadreGuarderiaDto {
  @IsIn(["BIOLOGICO", "LEGAL"]) tipoVinculo!: "BIOLOGICO" | "LEGAL";
  @Transform(limpiar) @IsOptional() @IsString() @MaxLength(20000) nombre?:
    string | null;
  @Transform(limpiar) @IsOptional() @IsString() @MaxLength(20000) cui?:
    string | null;
  @Transform(limpiar) @IsOptional() @IsString() @MaxLength(20000) telefono?:
    string | null;
  @Transform(limpiar) @IsOptional() @IsString() @MaxLength(20000) direccion?:
    string | null;
}
export class EditarPadreGuarderiaDto extends CrearPadreGuarderiaDto {
  @IsInt() @Min(1) version!: number;
  @IsString() @Matches(/\S/) @MaxLength(2000) motivo!: string;
}
