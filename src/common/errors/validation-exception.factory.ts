import { HttpStatus } from "@nestjs/common";
import { ValidationError } from "class-validator";

import {
  DetalleErrorPublico,
  ErrorPublicoException,
} from "./error-publico.exception";

const MENSAJES: Record<string, string> = {
  isDefined: "Completa este campo obligatorio.",
  isNotEmpty: "Completa este campo obligatorio.",
  isString: "Ingresa un texto válido.",
  isBoolean: "Selecciona una opción válida.",
  isInt: "Ingresa un número entero válido.",
  min: "Ingresa un valor dentro del rango permitido.",
  minLength: "El texto es más corto de lo permitido.",
  maxLength: "El texto supera la longitud permitida.",
  isLength: "El texto no tiene una longitud permitida.",
  isDateString: "Ingresa una fecha válida.",
  matches: "El dato tiene un formato incorrecto.",
  isObject: "Ingresa una estructura de datos válida.",
  nestedValidation: "Revisa los datos contenidos en este campo.",
  whitelistValidation: "Este campo no está permitido en esta operación.",
};

function detalles(
  errores: ValidationError[],
  prefijo = "",
): DetalleErrorPublico[] {
  return errores.flatMap((error) => {
    const campo = prefijo ? `${prefijo}.${error.property}` : error.property;
    const restricciones = Object.keys(error.constraints ?? {});
    const prioritaria = restricciones.includes("isDefined")
      ? "isDefined"
      : restricciones.includes("whitelistValidation")
        ? "whitelistValidation"
        : restricciones[0];
    const propios = prioritaria
      ? [
          {
            campo,
            mensaje: MENSAJES[prioritaria] ?? "Revisa el valor ingresado.",
          },
        ]
      : [];
    return [...propios, ...detalles(error.children ?? [], campo)];
  });
}

export function crearExcepcionValidacion(errores: ValidationError[]) {
  const erroresPublicos = detalles(errores);
  const soloUnObligatorio =
    erroresPublicos.length === 1 &&
    erroresPublicos[0].mensaje === MENSAJES.isDefined;
  return new ErrorPublicoException(
    HttpStatus.BAD_REQUEST,
    soloUnObligatorio ? "CAMPO_OBLIGATORIO" : "DATOS_INVALIDOS",
    soloUnObligatorio
      ? "Completa los campos obligatorios."
      : "Revisa los datos señalados antes de continuar.",
    erroresPublicos,
  );
}
