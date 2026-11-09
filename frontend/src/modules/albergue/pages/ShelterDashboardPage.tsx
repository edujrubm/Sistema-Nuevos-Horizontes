import { useQuery } from "@tanstack/react-query";

import {
  getShelterSummary,
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
  if (stay.fechaEgreso) return <span className="status inactive">Egresada</span>;
  return <span className="status active">Estancia activa</span>;
}

export function ShelterDashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["shelter", "summary"],
    queryFn: ({ signal }) => getShelterSummary(signal),
  });
  const staysQuery = useQuery({
    queryKey: ["shelter", "stays"],
    queryFn: ({ signal }) => listShelterStays(signal),
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
      />

      {isLoading ? <p className="status-message" role="status">Cargando información de Albergue…</p> : null}

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
            <strong>{summary.estanciasActivas}</strong>
            <span>Estancias activas</span>
          </article>
          <article className="panel shelter-metric">
            <strong>{summary.beneficiariasPresentes}</strong>
            <span>Beneficiarias presentes</span>
          </article>
          <article className="panel shelter-metric warning">
            <strong>{summary.salidasTemporalesPendientes}</strong>
            <span>Retornos pendientes</span>
          </article>
          <article className="panel shelter-metric">
            <strong>{summary.egresosRegistrados}</strong>
            <span>Egresos registrados</span>
          </article>
        </div>
      ) : null}

      {!isLoading && !error && stays.length === 0 ? (
        <div className="empty-state panel">
          <h2>Sin estancias registradas</h2>
          <p>No hay estancias para mostrar con los criterios actuales.</p>
        </div>
      ) : null}

      {stays.length > 0 ? (
        <section className="panel table-panel" aria-labelledby="shelter-stays-title">
          <div className="panel-section-header">
            <div>
              <h2 id="shelter-stays-title">Estancias registradas</h2>
              <p>Los datos personales se consultarán desde el expediente autorizado al integrar esa operación.</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Estancia</th><th>Beneficiaria</th><th>Ingreso</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {stays.map((stay) => (
                <tr key={stay.id}>
                  <td>#{stay.id}</td>
                  <td>Expediente vinculado #{stay.beneficiariaId}</td>
                  <td>{displayDate(stay.fechaIngreso)}</td>
                  <td><StayState stay={stay} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </section>
  );
}
