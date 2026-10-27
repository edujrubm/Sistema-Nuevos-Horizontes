import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ParseBigIntIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^\d+$/.test(value) || value === "0") {
      throw new BadRequestException(
        "El identificador debe ser un entero positivo.",
      );
    }
    return value;
  }
}
