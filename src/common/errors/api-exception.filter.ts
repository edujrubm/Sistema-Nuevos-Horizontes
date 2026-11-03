import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

import {
  ErrorPublicoException,
  RespuestaErrorPublico,
} from "./error-publico.exception";
import { generarIdSolicitud, SolicitudConId } from "./id-solicitud.middleware";

interface RespuestaHttpConCodigo {
  code?: string;
  codigo?: string;
  message?: string | string[];
  mensaje?: string;
  errores?: Array<{ campo: string; mensaje: string }>;
}

const CODIGOS_ANTERIORES: Record<string, { codigo: string; mensaje: string }> =
  {
    DUPLICATE_CUI: {
      codigo: "REGISTRO_DUPLICADO",
      mensaje:
        "Ya existe un registro con estos datos. Revisa el registro existente antes de continuar.",
    },
    VERSION_CONFLICT: {
      codigo: "VERSION_DESACTUALIZADA",
      mensaje:
        "Otra persona modificó este registro. Vuelve a consultarlo antes de guardar.",
    },
    STATE_CONFLICT: {
      codigo: "ESTADO_NO_PERMITIDO",
      mensaje: "El estado actual del registro no permite realizar esta acción.",
    },
    INVALID_PAGE: {
      codigo: "DATOS_INVALIDOS",
      mensaje: "Revisa los datos señalados antes de continuar.",
    },
    INVALID_PAGE_SECTIONS: {
      codigo: "DATOS_INVALIDOS",
      mensaje: "Revisa los datos señalados antes de continuar.",
    },
    INVALID_SECTION: {
      codigo: "DATOS_INVALIDOS",
      mensaje: "Revisa los datos señalados antes de continuar.",
    },
    INCOMPLETE_INITIAL_INTAKE: {
      codigo: "SOLICITUD_INCOMPLETA",
      mensaje: "Faltan datos para completar la operación.",
    },
  };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<SolicitudConId>();
    const response = http.getResponse<Response>();
    const idSolicitud = request.idSolicitud ?? generarIdSolicitud();
    response.setHeader("X-Id-Solicitud", idSolicitud);

    const error = this.normalizar(exception, request, idSolicitud);
    if (error.estado >= 500) {
      const causa =
        exception instanceof Error ? exception.name : typeof exception;
      this.logger.error(
        `${request.method} ${request.route?.path ?? "ruta-no-resuelta"} ${error.estado} ${error.codigo} ${idSolicitud} causa=${causa}`,
      );
    }
    response.status(error.estado).json(error);
  }

  private normalizar(
    exception: unknown,
    request: Request,
    idSolicitud: string,
  ): RespuestaErrorPublico {
    if (exception instanceof ErrorPublicoException) {
      return {
        estado: exception.getStatus(),
        codigo: exception.codigo,
        mensaje: exception.mensajePublico,
        errores: exception.erroresPublicos,
        idSolicitud,
      };
    }

    if (this.esBaseDatosNoDisponible(exception)) {
      return this.respuesta(
        HttpStatus.SERVICE_UNAVAILABLE,
        "BASE_DATOS_NO_DISPONIBLE",
        "No se puede consultar ni guardar información en este momento. Inténtalo más tarde.",
        idSolicitud,
      );
    }

    if (this.esJsonInvalido(exception)) {
      return this.respuesta(
        HttpStatus.BAD_REQUEST,
        "JSON_INVALIDO",
        "La información enviada no tiene un formato válido. Vuelve a intentarlo desde el formulario.",
        idSolicitud,
      );
    }

    if (exception instanceof HttpException) {
      const estado = exception.getStatus();
      const contenido = exception.getResponse();
      const objeto =
        typeof contenido === "object" && contenido !== null
          ? (contenido as RespuestaHttpConCodigo)
          : {};
      const codigoAnterior = objeto.code ?? objeto.codigo;
      const adaptado = codigoAnterior
        ? CODIGOS_ANTERIORES[codigoAnterior]
        : undefined;
      if (adaptado) {
        return this.respuesta(
          estado,
          adaptado.codigo,
          adaptado.mensaje,
          idSolicitud,
          objeto.errores ?? [],
        );
      }
      if (estado === HttpStatus.NOT_FOUND) {
        const rutaNoResuelta = !request.route;
        return this.respuesta(
          estado,
          rutaNoResuelta ? "RUTA_NO_ENCONTRADA" : "REGISTRO_NO_ENCONTRADO",
          rutaNoResuelta
            ? "No se encontró la operación solicitada."
            : "No se encontró el registro solicitado.",
          idSolicitud,
        );
      }
      return this.respuesta(
        estado,
        "SOLICITUD_RECHAZADA",
        "No se pudo completar la solicitud. Revisa los datos o comunícate con soporte e indica el número de solicitud.",
        idSolicitud,
      );
    }

    return this.respuesta(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "ERROR_INTERNO",
      "Ocurrió un problema inesperado. Comunícate con soporte e indica el número de solicitud.",
      idSolicitud,
    );
  }

  private esJsonInvalido(exception: unknown): boolean {
    const causa =
      exception instanceof Error && "cause" in exception
        ? exception.cause
        : undefined;
    const tipoCausa =
      typeof causa === "object" && causa !== null && "type" in causa
        ? (causa as { type?: string }).type
        : undefined;
    const contenido =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const mensaje =
      typeof contenido === "object" &&
      contenido !== null &&
      "message" in contenido
        ? (contenido as { message?: unknown }).message
        : undefined;
    return (
      (exception instanceof SyntaxError &&
        "status" in exception &&
        (exception as SyntaxError & { status?: number }).status === 400) ||
      causa instanceof SyntaxError ||
      tipoCausa === "entity.parse.failed" ||
      (typeof mensaje === "string" &&
        /JSON|Unexpected token|Unexpected end/i.test(mensaje))
    );
  }

  private esBaseDatosNoDisponible(exception: unknown): boolean {
    const codigo =
      typeof exception === "object" && exception !== null && "code" in exception
        ? (exception as { code?: string }).code
        : undefined;
    return new Set([
      "ECONNREFUSED",
      "ECONNRESET",
      "ENOTFOUND",
      "ETIMEDOUT",
      "08000",
      "08001",
      "08003",
      "08006",
      "57P01",
      "57P03",
    ]).has(codigo ?? "");
  }

  private respuesta(
    estado: number,
    codigo: string,
    mensaje: string,
    idSolicitud: string,
    errores: Array<{ campo: string; mensaje: string }> = [],
  ): RespuestaErrorPublico {
    return { estado, codigo, mensaje, errores, idSolicitud };
  }
}
