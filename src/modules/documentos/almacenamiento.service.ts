import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class AlmacenamientoService {
  private readonly directorio = join(
    process.cwd(),
    'storage',
    'private',
    'documentos',
  );

  async guardarPdf(archivo: Buffer) {
    await mkdir(this.directorio, { recursive: true });

    const objetoPrivado = `${randomUUID()}.pdf`;
    const ruta = join(this.directorio, objetoPrivado);

    await writeFile(ruta, archivo, { flag: 'wx', mode: 0o600 });

    const sha256 = createHash('sha256')
      .update(archivo)
      .digest('hex');

    return {
      objetoPrivado,
      mime: 'application/pdf',
      tamanoBytes: archivo.length,
      sha256,
    };
  }
}