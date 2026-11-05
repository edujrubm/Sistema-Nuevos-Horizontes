import { ArgumentsHost, Logger } from "@nestjs/common";

import { ApiExceptionFilter } from "./api-exception.filter";

describe("ApiExceptionFilter", () => {
  const request = {
    idSolicitud: "SOL-prueba",
    method: "POST",
    route: { path: "/prueba" },
  };
  const response = {
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
    response.status.mockReturnValue(response);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("oculta una excepción inesperada con el respaldo ERROR_INTERNO", () => {
    new ApiExceptionFilter().catch(new Error("detalle privado"), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      estado: 500,
      codigo: "ERROR_INTERNO",
      mensaje:
        "Ocurrió un problema inesperado. Comunícate con soporte e indica el número de solicitud.",
      errores: [],
      idSolicitud: "SOL-prueba",
    });
  });

  it("clasifica una desconexión conocida sin exponer detalles", () => {
    new ApiExceptionFilter().catch({ code: "ECONNREFUSED" }, host);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: "BASE_DATOS_NO_DISPONIBLE" }),
    );
  });
});
