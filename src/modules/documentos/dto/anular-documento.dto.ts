import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnularDocumentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo!: string;
}