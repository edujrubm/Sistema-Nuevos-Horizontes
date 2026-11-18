import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { ListaDto } from "../../common/dto/pagina.dto";
export class DocumentosListaDto extends ListaDto {
  @IsOptional() @IsString() @MaxLength(200) buscar?: string;
  @IsOptional() @IsString() @MaxLength(200) categoria?: string;
  @IsOptional() @IsIn(["VIGENTE", "ANULADO"]) estado?: string;
  @IsOptional() @IsIn(["true", "false"]) ultimas?: string;
}
