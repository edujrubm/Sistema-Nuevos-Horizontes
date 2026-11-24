import { ValidationError, ValidationPipe } from "@nestjs/common";
import { ErrorApi, ErrorCampo } from "./error-api";
function detalles(errors: ValidationError[], prefix = ""): ErrorCampo[] {
  return errors.flatMap((e) => {
    const campo = prefix
      ? /^\d+$/.test(e.property)
        ? `${prefix}[${e.property}]`
        : `${prefix}.${e.property}`
      : e.property;
    const mensajes: Record<string, string> = {
      whitelistValidation: "Este campo no está permitido en esta operación.",
      isDefined: "Completa este campo obligatorio.",
      isNotEmpty: "Completa este campo obligatorio.",
      isString: "Ingresa un texto válido.",
      isInt: "Ingresa un número entero válido.",
      min: "El número es menor que el mínimo permitido.",
      max: "El número supera el máximo permitido.",
      maxLength: "El texto supera la longitud permitida.",
      isObject: "Envía un objeto válido.",
      nestedValidation: "Revisa los datos de esta sección.",
      isISO8601: "Ingresa una fecha y hora válidas con zona horaria.",
      isPgId: "Selecciona un identificador válido.",
      matches: campo.endsWith("fechaAtencion")
        ? "Ingresa una fecha y hora válidas con zona horaria."
        : "Completa el campo con un formato válido; no uses solo espacios.",
    };
    return [
      ...Object.keys(e.constraints || {}).map((c) => ({
        campo,
        mensaje: mensajes[c] || "Revisa el formato de este campo.",
      })),
      ...detalles(e.children || [], campo),
    ];
  });
}
export function validacionApi() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) =>
      new ErrorApi("DATOS_INVALIDOS", detalles(errors)),
  });
}
