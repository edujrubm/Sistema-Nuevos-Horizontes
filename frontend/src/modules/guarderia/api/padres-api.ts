import { apiRequest, areaRequestOptions } from "@/shared/api/http-client";

import type { Pagina } from "@/shared/types/api";
export interface DatosPadre {
  tipoVinculo: "BIOLOGICO" | "LEGAL";
  nombre: string | null;
  cui: string | null;
  telefono: string | null;
  direccion: string | null;
}
export interface PadreGuarderia extends DatosPadre {
  id: string;
  ninoId: string;
  version: number;
  creadoEn: string;
  actualizadoEn: string;
}
const ruta = (b: string, n: string) =>
  `/guarderia/beneficiarias/${b}/hijos/${n}/padres`;
export const padresApi = {
  listar: (b: string, n: string, pagina: number, signal?: AbortSignal) =>
    apiRequest<Pagina<PadreGuarderia>>(
      ruta(b, n) + `?pagina=${pagina}&limite=20`,
      { signal },
      areaRequestOptions,
    ),
  crear: (b: string, n: string, datos: DatosPadre) =>
    apiRequest<PadreGuarderia>(
      ruta(b, n),
      {
        method: "POST",
        body: JSON.stringify(datos),
      },
      areaRequestOptions,
    ),
  editar: (
    b: string,
    n: string,
    id: string,
    datos: DatosPadre,
    version: number,
    motivo: string,
  ) =>
    apiRequest<PadreGuarderia>(
      ruta(b, n) + `/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ ...datos, version, motivo }),
      },
      areaRequestOptions,
    ),
};
