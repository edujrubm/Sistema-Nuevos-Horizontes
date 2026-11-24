import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { BeneficiariaContexto } from "@/shared/context/area-record-context";
import { consultaDesdeQuery } from "@/shared/api/query-result";
import { ErrorVista } from "@/shared/components/feedback";
import { guarderiaApi } from "../api/guarderia-api";

/** Cada catálogo falla de forma independiente; un error no oculta el otro dato. */
function DatoMaterno({
  id,
  tipo,
  etiqueta,
}: {
  id?: string | null;
  tipo: "estados-civiles" | "ocupaciones";
  etiqueta: string;
}) {
  const consulta = consultaDesdeQuery(
    useQuery({
      queryKey: ["guarderia", "catalogos", "madre", tipo],
      queryFn: ({ signal }) =>
        id ? guarderiaApi.maternalCatalog(tipo, signal) : Promise.resolve(null),
      enabled: Boolean(id),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const nombre = consulta.datos
    ?.find((opcion) => opcion.id === id)
    ?.nombre?.trim();
  const texto = !id
    ? "Sin registrar"
    : consulta.cargando
      ? "Cargando…"
      : consulta.error
        ? "No se pudo consultar"
        : nombre || "Dato registrado no disponible en el catálogo";
  return (
    <div>
      <label>
        {etiqueta}
        <span className="readonly">{texto}</span>
      </label>
      <ErrorVista error={consulta.error} reintentar={consulta.recargar} />
    </div>
  );
}
/** Consulta las claves del perfil materno existente; no guarda copias en Guardería. */
export function ContextoMaternoGuarderia({
  persona,
}: {
  persona?: BeneficiariaContexto;
}) {
  const madre = persona?.fichaInicial ? persona : undefined;
  return (
    <>
      <DatoMaterno
        etiqueta="Estado civil"
        tipo="estados-civiles"
        id={madre?.estadoCivilId}
      />
      <DatoMaterno
        etiqueta="Ocupación"
        tipo="ocupaciones"
        id={madre?.ocupacionId}
      />
    </>
  );
}
