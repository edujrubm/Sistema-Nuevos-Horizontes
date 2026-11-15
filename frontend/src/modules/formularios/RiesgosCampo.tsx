const opciones = [
  "Vivienda insegura",
  "Dependencia económica",
  "Ausencia de red de apoyo",
  "Riesgo para hijas o hijos",
];
export function RiesgosCampo({
  value,
  cambiar,
  disabled,
}: {
  value: string;
  cambiar: (v: string) => void;
  disabled: boolean;
}) {
  const partes = value.split("\n");
  const seleccionadas = partes.filter((v) => opciones.includes(v));
  const otros = partes.filter((v) => !opciones.includes(v)).join("\n");
  function actualizar(opcion: string, checked: boolean) {
    const actual = checked
      ? [...partes, opcion]
      : partes.filter((v) => v !== opcion);
    cambiar(actual.join("\n"));
  }
  return (
    <fieldset className="full risks-field" disabled={disabled}>
      <legend>Riesgos identificados</legend>
      <div className="checks">
        {opciones.map((o) => (
          <label className="choice" key={o}>
            <input
              type="checkbox"
              checked={seleccionadas.includes(o)}
              onChange={(e) => actualizar(o, e.target.checked)}
            />
            {o}
          </label>
        ))}
      </div>
      <label>
        Otros riesgos o detalle
        <textarea
          value={otros}
          maxLength={19000}
          onChange={(e) =>
            cambiar(
              [...seleccionadas, ...e.target.value.split("\n")].join("\n"),
            )
          }
        />
      </label>
    </fieldset>
  );
}
