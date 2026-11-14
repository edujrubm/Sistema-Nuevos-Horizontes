import type { UseQueryResult } from "@tanstack/react-query";

/** Conserva los nombres de presentación sin implementar otra caché o transporte. */
export function consultaDesdeQuery<T>(query: UseQueryResult<T, Error>) {
  return {
    datos: query.data ?? undefined,
    error: query.error ?? undefined,
    // Una consulta deshabilitada no bloquea un borrador nuevo ni una sección oculta.
    cargando:
      query.isFetching || (query.isPending && query.fetchStatus !== "idle"),
    recargar: () => {
      void query.refetch();
    },
  };
}
