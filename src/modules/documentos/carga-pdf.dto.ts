import { IsString, Matches, MaxLength } from "class-validator";
import { IsPgId } from "../persona3/dto/pg-id.validator";

export class CargaPdfDto {
  @IsPgId() formularioId!: string;
  @IsString() @Matches(/\S/) @MaxLength(200) categoria!: string;
}
