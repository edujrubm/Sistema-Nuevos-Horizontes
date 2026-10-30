import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/** Valida identificadores PostgreSQL bigint sin convertirlos a Number y perder precisión. */
@Injectable()
export class ParseBigIntIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException('El identificador debe ser un entero positivo.');
    }

    return value;
  }
}
