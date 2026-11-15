import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { ErrorApi } from "../../../../common/errors/error-api";
import { FichaGuarderiaDetalleDto } from "../dto/ficha-guarderia.dto";

/** Comprueba formato, rango y claves; no inventa campos obligatorios al confirmar. */
export function validarDetalleGuarderia(detalle: Record<string, unknown> = {}) {
  const dto = plainToInstance(FichaGuarderiaDetalleDto, detalle);
  const errores = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errores.length)
    throw new ErrorApi(
      "DATOS_INVALIDOS",
      errores.map((error) => ({
        campo: `detalle.${error.property}`,
        mensaje: error.constraints?.whitelistValidation
          ? "Este campo no está permitido en la ficha guarderia."
          : "Revisa el formato y la longitud de este campo.",
      })),
    );
  // Mantiene null para permitir limpiar un campo, sin enviar undefined a TypeORM.
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  );
}
