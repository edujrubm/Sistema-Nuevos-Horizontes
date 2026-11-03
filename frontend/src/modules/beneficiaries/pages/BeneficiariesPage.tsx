import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { listBeneficiaries } from "../api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

export function BeneficiariesPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["beneficiaries", search],
    queryFn: ({ signal }) => listBeneficiaries(search, signal),
  });

  const error = query.error instanceof ApiError ? query.error.body : undefined;

  return (
    <section>
      <PageHeader
        title="Beneficiarias"
        description="Consulta expedientes existentes o inicia una nueva ficha de admisión."
        action={<Link className="button primary" to="/fichas/nueva">Iniciar ficha inicial</Link>}
      />

      <div className="panel search-panel">
        <label htmlFor="beneficiary-search">Buscar por nombre o código autorizado</label>
        <input
          id="beneficiary-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Escribe para buscar"
        />
      </div>

      {query.isLoading && <p className="status-message" role="status">Cargando beneficiarias…</p>}
      {error && (
        <div className="alert error" role="alert">
          <strong>No fue posible consultar la información.</strong>
          <span>{error.mensaje}</span>
          <small>Solicitud: {error.idSolicitud}</small>
        </div>
      )}
      {query.data?.data.length === 0 && (
        <div className="empty-state">
          <h2>Sin resultados</h2>
          <p>No se encontraron beneficiarias con los criterios indicados.</p>
        </div>
      )}
      {!!query.data?.data.length && (
        <div className="panel table-panel">
          <table>
            <thead><tr><th>Nombre</th><th>Acción</th></tr></thead>
            <tbody>
              {query.data.data.map((beneficiary) => (
                <tr key={beneficiary.id}>
                  <td>{beneficiary.nombre}</td>
                  <td><button className="button text" type="button" disabled>Ver perfil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
