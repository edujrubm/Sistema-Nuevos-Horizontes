import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  getShelterSummary,
  listShelterHistory,
  listShelterStays,
  type ShelterStay,
} from "../api/albergue-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

function apiMessage(error: unknown) {
  return error instanceof ApiError ? error.body.mensaje : undefined;
}

function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(date);
}

function StayState({ stay }: { stay: ShelterStay }) {
  if (stay.fechaEgreso)
    return <span className="status inactive">Egresada</span>;
  return <span className="status active">Estancia activa</span>;
}

export function ShelterDashboardPage() {
  const [filters, setFilters] = useState({
    pagina: 1,
    presencia: "SITIO",
    buscar: "",
  });
  const summaryQuery = useQuery({
    queryKey: ["shelter", "summary"],
    queryFn: ({ signal }) => getShelterSummary(signal),
  });
  const staysQuery = useQuery({
    queryKey: ["shelter", "stays", filters],
    queryFn: ({ signal }) =>
      listShelterStays(signal, { ...filters, estado: "ACTIVAS" }),
  });
  const recent = useQuery({
    queryKey: ["shelter", "recent"],
    queryFn: ({ signal }) =>
      listShelterHistory({ pagina: 1, tipo: "", desde: "", hasta: "" }, signal),
  });
  const error = summaryQuery.error ?? staysQuery.error;
  const isLoading = summaryQuery.isLoading || staysQuery.isLoading;
  const summary = summaryQuery.data;
  const stays = staysQuery.data?.datos ?? [];

  return (
    <section>
      <PageHeader
        title="Albergue"
        description="Consulta la concurrencia y las estancias activas de las beneficiarias."
        action={
          <Link className="button primary" to="/albergue/ingreso">
            Registrar ingreso
          </Link>
        }
      />

      {isLoading ? (
        <p className="status-message" role="status">
          Cargando información de Albergue…
        </p>
      ) : null}

      {error ? (
        <div className="alert error" role="alert">
          <strong>No fue posible cargar la información de Albergue.</strong>
          <span>{apiMessage(error) ?? "Inténtalo nuevamente."}</span>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              void summaryQuery.refetch();
              void staysQuery.refetch();
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="shelter-metrics" aria-label="Resumen de ocupación">
          <article className="panel shelter-metric">
            <strong>
              {summary.personasActivas ?? summary.estanciasActivas}
            </strong>
            <span>Personas activas</span>
          </article>
          <article className="panel shelter-metric">
            <strong>{summary.estanciasActivas}</strong>
            <span>Beneficiarias</span>
          </article>
          <article className="panel shelter-metric warning">
            <strong>{summary.salidasTemporalesPendientes}</strong>
            <span>Retornos pendientes</span>
          </article>
          <article className="panel shelter-metric">
            <strong>{summary.menoresActivos ?? "—"}</strong>
            <span>Hijas, hijos e infantes</span>
          </article>
        </div>
      ) : null}

      {!isLoading && !error && stays.length === 0 ? (
        <div className="empty-state panel">
          <h2>Sin estancias registradas</h2>
          <p>No hay estancias para mostrar con los criterios actuales.</p>
        </div>
      ) : null}

      <div className="shelter-concurrency-layout">
        <div>
          {stays.length > 0 ? (
            <section
              className="panel table-panel"
              aria-labelledby="shelter-stays-title"
            >
              <div className="panel-section-header">
                <div>
                  <h2 id="shelter-stays-title">Estancias registradas</h2>
                  <p>Estancias activas y acompañantes registrados.</p>
                  <label>
                    Buscar por nombre o DPI/CUI
                    <input
                      value={filters.buscar}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          buscar: e.target.value,
                          pagina: 1,
                        })
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="shelter-tabs">
                {[
                  ["SITIO", "En sitio"],
                  ["SALIDA", "Con salida registrada"],
                  ["TODOS", "Todos"],
                ].map(([v, t]) => (
                  <button
                    type="button"
                    className={filters.presencia === v ? "active" : ""}
                    key={v}
                    onClick={() =>
                      setFilters({ ...filters, presencia: v, pagina: 1 })
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Estancia</th>
                      <th>Beneficiaria</th>
                      <th>Ingreso</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stays.map((stay) => (
                      <Fragment key={stay.id}>
                        <tr>
                          <td>#{stay.id}</td>
                          <td>
                            {stay.beneficiariaNombre ||
                              `Expediente vinculado #${stay.beneficiariaId}`}
                          </td>
                          <td>{displayDate(stay.fechaIngreso)}</td>
                          <td>
                            {stay.salidaPendiente ? (
                              <span className="status draft">
                                Salida temporal
                              </span>
                            ) : (
                              <StayState stay={stay} />
                            )}
                          </td>
                        </tr>
                        {stay.acompanantes?.map((n) => (
                          <tr key={n.id}>
                            <td>Infante</td>
                            <td>
                              {n.nombre}
                              <small>
                                {" "}
                                · Vinculado a {stay.beneficiariaNombre}
                              </small>
                            </td>
                            <td>{displayDate(stay.fechaIngreso)}</td>
                            <td>Acompañante de estancia activa</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="form-actions">
                <span>
                  {staysQuery.data?.paginacion.total ?? 0} estancias · Página{" "}
                  {filters.pagina}
                </span>
                <button
                  className="button secondary"
                  disabled={filters.pagina === 1 || staysQuery.isFetching}
                  onClick={() =>
                    setFilters({ ...filters, pagina: filters.pagina - 1 })
                  }
                >
                  Anterior
                </button>
                <button
                  className="button secondary"
                  disabled={
                    !staysQuery.data ||
                    filters.pagina >= staysQuery.data.paginacion.totalPaginas ||
                    staysQuery.isFetching
                  }
                  onClick={() =>
                    setFilters({ ...filters, pagina: filters.pagina + 1 })
                  }
                >
                  Siguiente
                </button>
              </div>
            </section>
          ) : null}
        </div>
        <aside className="shelter-right">
          <section className="panel shelter-occupancy">
            <h2>Ocupación actual</h2>
            <div
              className="shelter-total"
              style={{
                background: `conic-gradient(#5b2a9d ${summary?.personasActivas ? (summary.estanciasActivas / summary.personasActivas) * 100 : 0}%, #c9b6df 0)`,
              }}
            >
              <span>{summary?.personasActivas ?? "—"}</span>
            </div>
            <p>personas activas</p>
            <p>Beneficiarias: {summary?.estanciasActivas ?? "—"}</p>
            <p>Infantes: {summary?.menoresActivos ?? "—"}</p>
            <small>
              El conteo incluye estancias activas. No representa habitaciones ni
              camas.
            </small>
          </section>
          <section className="panel">
            <h2>Movimientos recientes</h2>
            {recent.isLoading && <p>Cargando…</p>}
            {recent.error && (
              <p role="alert">
                No fue posible consultar los movimientos recientes.
              </p>
            )}
            {recent.data?.datos.slice(0, 3).map((e) => (
              <article className="shelter-recent" key={e.id}>
                <strong>
                  {{
                    INGRESO: "Nuevo ingreso",
                    SALIDA_TEMPORAL: "Salida temporal registrada",
                    RETORNO: "Retorno confirmado",
                    EGRESO: "Egreso registrado",
                    NACIMIENTO: "Nacimiento registrado",
                  }[e.tipo] || e.tipo}
                </strong>
                <p>{e.beneficiariaNombre}</p>
                <small>
                  {new Intl.DateTimeFormat("es-GT", {
                    timeZone: "America/Guatemala",
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(e.fecha))}{" "}
                  · {e.responsable}
                </small>
              </article>
            ))}
          </section>
          {summary && summary.salidasTemporalesPendientes > 0 && (
            <div className="alert warning">
              <strong>
                {summary.salidasTemporalesPendientes} retornos pendientes
              </strong>
              <p>
                Las beneficiarias conservan su estancia activa durante la salida
                temporal.
              </p>
              <Link to="/albergue/movimientos">Revisar</Link>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
