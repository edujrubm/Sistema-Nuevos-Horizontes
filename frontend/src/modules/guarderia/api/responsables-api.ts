import { apiRequest, areaRequestOptions } from "@/shared/api/http-client";

import type { Pagina } from "@/shared/types/api";
export interface ResponsableGuarderia {
  id: string;
  formularioId: string;
  nombre: string;
  cui: string;
  relacion: string;
  telefono: string;
  creadoEn: string;
  actualizadoEn: string;
}
export type DatosResponsable = Pick<
  ResponsableGuarderia,
  "nombre" | "cui" | "relacion" | "telefono"
>;
const ruta = (beneficiaria: string, ficha: string) =>
  `/guarderia/beneficiarias/${beneficiaria}/fichas/${ficha}/responsables`;
export const responsablesApi = {
  listar: (
    beneficiaria: string,
    ficha: string,
    pagina: number,
    signal?: AbortSignal,
  ) =>
    apiRequest<Pagina<ResponsableGuarderia> & { version: number }>(
      ruta(beneficiaria, ficha) + `?pagina=${pagina}&limite=20`,
      { signal },
      areaRequestOptions,
    ),
  guardar: (
    beneficiaria: string,
    ficha: string,
    input: DatosResponsable & { version: number; motivo: string },
    id?: string,
  ) =>
    apiRequest<{ responsable: ResponsableGuarderia; version: number }>(
      ruta(beneficiaria, ficha) + (id ? `/${id}` : ""),
      { method: id ? "PATCH" : "POST", body: JSON.stringify(input) },
      areaRequestOptions,
    ),
};
