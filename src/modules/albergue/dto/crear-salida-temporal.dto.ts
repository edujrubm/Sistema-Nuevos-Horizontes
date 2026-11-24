import { Matches, IsString, MaxLength, IsNotEmpty, IsArray, IsOptional, ArrayUnique, ArrayMaxSize } from "class-validator";
import { IsPgId } from "../../../common/validation/pg-id.validator";

export class CrearSalidaTemporalDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(200)
  trabajadorAsignado!: string;

  @Matches(/\S/)
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  destino!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(30)
  @IsPgId({ each: true })
  ninoIds?: string[];
}
