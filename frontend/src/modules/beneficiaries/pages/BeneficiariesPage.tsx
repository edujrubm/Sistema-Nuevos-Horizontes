import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listBeneficiaries } from "../api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

export function BeneficiariesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const query = useInfiniteQuery({
    queryKey: ["beneficiaries", search],
    queryFn: ({ pageParam, signal }) => listBeneficiaries(search, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.page.nextCursor ?? undefined,
  });

  const error = query.error instanceof ApiError ? query.error.body : undefined;
  const beneficiaries = query.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section>
      <PageHeader
        title="Beneficiarias"
        description="Consulta expedientes existentes o inicia una nueva ficha de admisión."
        action={<Link className="button primary" to="/fichas/nueva">Iniciar ficha inicial</Link>}
      />

      <div className="panel search-panel">
        <label htmlFor="beneficiary-search">Buscar por nombre</label>
        <input
          id="beneficiary-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Escribe al menos una parte del nombre"
        />
        <small>La consulta se actualiza automáticamente. El DPI/CUI no se expone en la dirección del navegador.</small>
      </div>

      {query.isLoading && <p className="status-message" role="status">Cargando beneficiarias…</p>}
      {error && (
        <div className="alert error" role="alert">
          <strong>No fue posible consultar la información.</strong>
          <span>{error.mensaje}</span>
          <small>Solicitud: {error.idSolicitud}</small>
        </div>
      )}
      {!query.isLoading && beneficiaries.length === 0 && !error && (
        <div className="empty-state">
          <h2>Sin resultados</h2>
          <p>No se encontraron beneficiarias con los criterios indicados.</p>
        </div>
      )}
      {beneficiaries.length > 0 && (
        <div className="panel table-panel">
          <table>
            <thead><tr><th>Nombre</th><th>Fecha de nacimiento</th><th>DPI/CUI</th><th>Acción</th></tr></thead>
            <tbody>
              {beneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id}>
                  <td>{beneficiary.nombre}</td>
                  <td>{beneficiary.fechaNacimiento ?? "No registrada"}</td>
                  <td>{beneficiary.cuiEnmascarado ?? "No registrado"}</td>
                  <td><Link className="button text" to={`/beneficiarias/${beneficiary.id}`}>Ver expediente</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {query.hasNextPage && (
            <div className="pagination-actions">
              <button className="button secondary" type="button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage ? "Cargando…" : "Cargar más beneficiarias"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
