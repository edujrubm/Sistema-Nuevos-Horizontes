import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { ErrorApi } from "../../../../common/errors/error-api";
import { FichaSocialDetalleDto } from "../dto/ficha-social.dto";

/** Comprueba formato, rango y claves; no inventa campos obligatorios al confirmar. */
export function validarDetalleSocial(detalle: Record<string, unknown> = {}) {
  const dto = plainToInstance(FichaSocialDetalleDto, detalle);
  const errores = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
  if (errores.length) throw new ErrorApi("DATOS_INVALIDOS", errores.map(error => ({
    campo: `detalle.${error.property}`,
    mensaje: error.constraints?.whitelistValidation
      ? "Este campo no está permitido en la ficha social."
      : "Revisa el formato y la longitud de este campo.",
  })));
  // Mantiene null para permitir limpiar un campo, sin enviar undefined a TypeORM.
  return Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
}
