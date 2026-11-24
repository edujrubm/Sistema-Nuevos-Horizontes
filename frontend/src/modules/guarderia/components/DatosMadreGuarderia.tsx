import type { BeneficiariaContexto } from "@/shared/context/area-record-context";

/** Consulta el perfil asociado a la ficha inicial sin duplicar datos ni revelar el CUI. */
export function DatosMadreGuarderia({
  persona,
}: {
  persona?: BeneficiariaContexto;
}) {
  const madre = persona?.fichaInicial ? persona : undefined;
  const texto = (valor: unknown) =>
    typeof valor === "string" && valor.trim() ? valor : "Sin registrar";
  const campos: Array<[string, unknown]> = [
    ["Nombre", madre?.nombre],
    ["DPI/CUI", madre?.cuiEnmascarado],
    ["Dirección", madre?.residencia?.direccionActual],
    ["Teléfono", madre?.residencia?.telefonoCelular],
  ];
  return (
    <section aria-label="Datos de la madre">
      <h3>Madre</h3>
      {!madre && (
        <p>
          No hay una ficha inicial disponible para consultar los datos de la
          madre.
        </p>
      )}
      {campos.map(([etiqueta, valor]) => (
        <label key={etiqueta}>
          {etiqueta}
          <span className="readonly">{texto(valor)}</span>
        </label>
      ))}
    </section>
  );
}
