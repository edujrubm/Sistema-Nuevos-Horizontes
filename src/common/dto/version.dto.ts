import { IsInt, Min, IsString, Matches, MaxLength } from "class-validator";
export class TransicionDto {
  @IsInt() @Min(1) version!: number;
  @IsString() @Matches(/\S/) @MaxLength(2000) motivo!: string;
}
