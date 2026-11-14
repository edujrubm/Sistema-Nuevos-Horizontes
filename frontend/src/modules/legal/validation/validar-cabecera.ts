import { ApiError } from "@/shared/api/api-error";

/** Valida formatos existentes antes de convertir la fecha; no impone fechas futuras/pasadas. */
export function validarCabeceraLegal(atencion: string, profesional: string) {
  const errores: { campo: string; mensaje: string }[] = [];
  const fecha = new Date(atencion + "-06:00");
  const fechaValida =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(atencion) &&
    Number.isFinite(fecha.getTime()) &&
    new Date(fecha.getTime() - 6 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16) === atencion;
  if (!fechaValida)
    errores.push({
      campo: "fechaAtencion",
      mensaje: "Ingresa una fecha y hora de atención válidas.",
    });
  const numerico = /^\d+$/.test(profesional);
  const id = numerico ? BigInt(profesional) : 0n;
  if (!numerico || id < 1n || id > 9223372036854775807n)
    errores.push({
      campo: "profesionalId",
      mensaje:
        "Ingresa un identificador de profesional válido, mayor que cero.",
    });
  if (errores.length)
    throw new ApiError({
      estado: 400,
      codigo: "FORMATO_INVALIDO",
      mensaje: "Revisa los campos señalados.",
      errores: errores,
      idSolicitud: "no-disponible",
    });
  return { fechaAtencion: fecha.toISOString(), profesionalId: id.toString() };
}
