import { ErrorApi } from "../../common/errors/error-api";
export function validarReferenciaCompleta(detalle: Record<string, unknown>) {
  const errores = [
    {
      campo: "detalle.destino",
      valor: detalle.destino,
      mensaje: "Indica la institución o el destino de la referencia.",
    },
    {
      campo: "detalle.motivoReferencia",
      valor: detalle.motivoReferencia,
      mensaje: "Escribe el motivo de la referencia.",
    },
  ]
    .filter((d) => typeof d.valor !== "string" || !d.valor.trim())
    .map(({ campo, mensaje }) => ({ campo, mensaje }));
  if (errores.length) throw new ErrorApi("DATOS_INVALIDOS", errores);
}
