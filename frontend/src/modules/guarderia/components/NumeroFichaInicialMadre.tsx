import type { BeneficiariaContexto } from "@/shared/context/area-record-context";

/** Reutiliza el número del expediente; no confunde la ficha inicial con un juicio. */
export function NumeroFichaInicialMadre({
  persona,
  etiqueta = "Número de ficha inicial de la madre",
}: {
  persona?: BeneficiariaContexto;
  etiqueta?: string;
}) {
  const ficha = persona?.fichaInicial;
  const numero =
    ficha?.correlativo?.trim() ||
    (ficha?.id ? `Ficha #${ficha.id}` : "Sin registrar");
  return (
    <label>
      {etiqueta}
      <span className="readonly">{numero}</span>
    </label>
  );
}
