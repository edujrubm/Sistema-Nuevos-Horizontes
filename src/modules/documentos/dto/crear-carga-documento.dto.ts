import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearCargaDocumentoDto {
  @IsNotEmpty()
  @IsNumberString()
  formularioId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoria!: string;
}