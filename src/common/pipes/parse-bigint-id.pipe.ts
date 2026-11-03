import { HttpStatus, Injectable, PipeTransform } from "@nestjs/common";
import { ErrorPublicoException } from "../errors/error-publico.exception";

@Injectable()
export class ParseBigIntIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^\d+$/.test(value) || value === "0") {
      throw new ErrorPublicoException(
        HttpStatus.BAD_REQUEST,
        "IDENTIFICADOR_INVALIDO",
        "El identificador del registro no es válido.",
        [
          {
            campo: "id",
            mensaje: "Ingresa un identificador entero positivo.",
          },
        ],
      );
    }
    return value;
  }
}
