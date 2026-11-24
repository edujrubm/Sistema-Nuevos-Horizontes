export interface EnlaceMockup {
  label: string;
  icono: string;
  to?: string;
  actual?: boolean;
}
export function navegacionMockup(area: string, base: string): EnlaceMockup[] {
  const ruta =
    area === "Área Legal"
      ? "/legal"
      : area === "Trabajo Social"
        ? "/social"
        : area === "Guardería"
          ? "/guarderia"
          : null;
  if (ruta)
    return [
      { label: "Beneficiarias", icono: "⌕", to: "/beneficiarias" },
      { label: area, icono: "◉", to: base + ruta, actual: true },
      { label: "Hoja evolutiva", icono: "≡", to: base + "/evolucion" },
      { label: "Documentos", icono: "▤" },
      { label: "Reportes", icono: "▦" },
    ];
  if (area === "Hoja evolutiva")
    return [
      { label: "Beneficiarias", icono: "⌕", to: "/beneficiarias" },
      {
        label: "Hoja evolutiva",
        icono: "≡",
        to: base + "/evolucion",
        actual: true,
      },
      { label: "Documentos", icono: "▤" },
      { label: "Reportes", icono: "▦" },
    ];
  return [
    { label: "Inicio", icono: "⌂", to: "/" },
    {
      label: "Beneficiarias",
      icono: "⌕",
      to: "/beneficiarias",
      actual: base === "/beneficiarias/",
    },
    {
      label: "Expedientes",
      icono: "▤",
      to: base === "/beneficiarias/" ? undefined : base,
      actual: base !== "/beneficiarias/",
    },
    { label: "Albergue", icono: "◉" },
    { label: "Auditoría", icono: "≡" },
  ];
}
