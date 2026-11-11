import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { ListaDto } from "../persona3/dto/contratos.dto";
export class DocumentosListaDto extends ListaDto {
  @IsOptional() @IsString() @MaxLength(200) buscar?: string;
  @IsOptional() @IsString() @MaxLength(200) categoria?: string;
  @IsOptional() @IsIn(["VIGENTE", "BORRADOR", "ANULADO"]) estado?: string;
  @IsOptional() @IsIn(["true", "false"]) ultimas?: string;
}
