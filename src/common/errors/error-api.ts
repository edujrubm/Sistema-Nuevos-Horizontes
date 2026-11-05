import { HttpException } from "@nestjs/common";
import { CATALOGO, CodigoError } from "./catalogo";
export interface ErrorCampo {
  campo: string;
  mensaje: string;
}
export class ErrorApi extends HttpException {
  constructor(
    readonly codigo: CodigoError,
    readonly errores: ErrorCampo[] = [],
  ) {
    super(CATALOGO[codigo].mensaje, CATALOGO[codigo].estado);
  }
}
export function codigoTecnico(error: unknown): string | undefined {
  try {
    const e = error as {
      code?: unknown;
      driverError?: { code?: unknown };
    } | null;
    const code = e?.driverError?.code ?? e?.code;
    return typeof code === "string" ? code : undefined;
  } catch {
    return undefined;
  }
}
export function falloConexion(error: unknown): boolean {
  const code = codigoTecnico(error);
  return (
    !!code &&
    (/^08[A-Z0-9]{3}$/.test(code) ||
      [
        "ECONNREFUSED",
        "ECONNRESET",
        "ETIMEDOUT",
        "EPIPE",
        "ENOTFOUND",
        "57P01",
        "57P02",
        "57P03",
        "53300",
      ].includes(code))
  );
}
