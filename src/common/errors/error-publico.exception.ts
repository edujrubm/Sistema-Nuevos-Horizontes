import { HttpException, HttpStatus } from "@nestjs/common";

export interface DetalleErrorPublico {
  campo: string;
  mensaje: string;
}

export interface RespuestaErrorPublico {
  estado: number;
  codigo: string;
  mensaje: string;
  errores: DetalleErrorPublico[];
  idSolicitud: string;
}

export class ErrorPublicoException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly codigo: string,
    readonly mensajePublico: string,
    readonly erroresPublicos: DetalleErrorPublico[] = [],
  ) {
    super(mensajePublico, status);
  }
}
