import { IsNotEmpty, IsNumberString } from "class-validator";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
} from "class-validator";
import { IsPgId } from "../../../common/validation/pg-id.validator";

export class CrearEstanciaDto {
  @IsPgId()
  beneficiariaId!: string;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(30)
  @IsPgId({ each: true })
  ninoIds?: string[];
}
