import { ErrorApi } from "../../common/errors/error-api";
import { Injectable, PipeTransform } from "@nestjs/common";
@Injectable()
export class BigintIdPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n)
      throw new ErrorApi("IDENTIFICADOR_INVALIDO");
    return value;
  }
}
