import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  createTemporaryExit,
  listPendingTemporaryExits,
  listAllActiveStays,
  registerShelterReturn,
  type PendingTemporaryExit,
} from "../api/albergue-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";
import { SelectField, TextField } from "@/shared/components/forms";

function apiMessage(error: unknown) {
  return error instanceof ApiError ? error.body.mensaje : undefined;
}

function displayDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-GT", {
        timeZone: "America/Guatemala",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function ShelterMovementsPage() {
  const queryClient = useQueryClient();
  const [stayId, setStayId] = useState("");
  const [destination, setDestination] = useState("");
  const [worker, setWorker] = useState("");
  const [returnCandidate, setReturnCandidate] =
    useState<PendingTemporaryExit>();
  const staysQuery = useQuery({
    queryKey: ["shelter", "stays"],
    queryFn: ({ signal }) => listAllActiveStays(signal),
  });
  const pendingQuery = useQuery({
    queryKey: ["shelter", "pending-exits"],
    queryFn: ({ signal }) => listPendingTemporaryExits(signal),
  });
  const activeStays = useMemo(
    () =>
      (staysQuery.data?.datos ?? []).filter(
        (stay) => !stay.fechaEgreso && !stay.salidaPendiente,
      ),
    [staysQuery.data],
  );
  const createMutation = useMutation({
    mutationFn: () =>
      createTemporaryExit(stayId, {
        destino: destination.trim(),
        trabajadorAsignado: worker.trim() || undefined,
      }),
    onSuccess: async () => {
      setStayId("");
      setDestination("");
      setWorker("");
      await queryClient.invalidateQueries({ queryKey: ["shelter"] });
    },
  });
  const returnMutation = useMutation({
    mutationFn: (id: string) => registerShelterReturn(id),
    onSuccess: async () => {
      setReturnCandidate(undefined);
      await queryClient.invalidateQueries({ queryKey: ["shelter"] });
    },
  });
  const destinationError = destination.trim()
    ? undefined
    : "El destino es obligatorio.";
  const loadError = staysQuery.error ?? pendingQuery.error;

  return (
    <section>
      <PageHeader
        title="Salidas y retornos"
        description="Registra movimientos temporales de beneficiarias con estancia activa."
        action={
          <Link className="button secondary" to="/albergue">
            Volver a Albergue
          </Link>
        }
      />
      {loadError ? (
        <div className="alert error" role="alert">
          <strong>No fue posible consultar las estancias.</strong>
          <span>{apiMessage(loadError) ?? "Inténtalo nuevamente."}</span>
        </div>
      ) : null}
      <div className="shelter-movement-grid">
        <section className="panel form-panel">
          <fieldset
            className="shelter-operation"
            disabled={createMutation.isPending}
          >
            <div className="section-heading">
              <h2>Registrar salida temporal</h2>
              <p>La salida temporal no finaliza la estancia.</p>
            </div>
            <div className="form-grid">
              <SelectField
                label="Estancia activa"
                value={stayId}
                onChange={(event) => setStayId(event.target.value)}
                required
              >
                <option value="">Selecciona una estancia</option>
                {activeStays.map((stay) => (
                  <option key={stay.id} value={stay.id}>
                    Estancia #{stay.id} ·{" "}
                    {stay.beneficiariaNombre ||
                      `Expediente #${stay.beneficiariaId}`}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Destino"
                value={destination}
                maxLength={100}
                error={
                  destination && destinationError ? destinationError : undefined
                }
                onChange={(event) => setDestination(event.target.value)}
                required
              />
              <TextField
                label="Trabajadora o trabajador asignado"
                value={worker}
                maxLength={200}
                hint="Opcional."
                onChange={(event) => setWorker(event.target.value)}
              />
            </div>
            <div className="form-actions">
              <button
                className="button primary"
                type="button"
                disabled={
                  !stayId ||
                  Boolean(destinationError) ||
                  createMutation.isPending
                }
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending
                  ? "Registrando…"
                  : "Registrar salida temporal"}
              </button>
            </div>
            {createMutation.isSuccess ? (
              <div className="alert success" role="status">
                <strong>Salida temporal registrada.</strong>
                <span>
                  La estancia sigue activa; registra el retorno cuando la
                  beneficiaria vuelva.
                </span>
              </div>
            ) : null}
            {createMutation.error ? (
              <div className="alert error" role="alert">
                <strong>No fue posible registrar la salida.</strong>
                <span>
                  {apiMessage(createMutation.error) ?? "Inténtalo nuevamente."}
                </span>
              </div>
            ) : null}
          </fieldset>
        </section>
        <section
          className="panel shelter-pending-panel"
          aria-labelledby="pending-returns-title"
        >
          <div className="panel-section-header">
            <h2 id="pending-returns-title">Retornos pendientes</h2>
            <p>
              Confirma el retorno solamente cuando la beneficiaria ya esté de
              vuelta.
            </p>
          </div>
          {pendingQuery.isLoading ? (
            <p className="status-message" role="status">
              Cargando retornos pendientes…
            </p>
          ) : null}
          {!pendingQuery.isLoading &&
          !loadError &&
          (pendingQuery.data?.length ?? 0) === 0 ? (
            <p className="empty-state">No hay retornos pendientes.</p>
          ) : null}
          <div className="shelter-pending-list">
            {(pendingQuery.data ?? []).map((exit) => (
              <article className="shelter-pending" key={exit.movimientoId}>
                <div>
                  <strong>{exit.beneficiariaNombre}</strong>
                  <span>
                    {exit.destino} · Salida: {displayDateTime(exit.fechaSalida)}
                  </span>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setReturnCandidate(exit)}
                >
                  Registrar retorno
                </button>
              </article>
            ))}
          </div>
          {returnCandidate ? (
            <div className="alert warning">
              <strong>Confirmación requerida</strong>
              <span>
                Confirmarás el retorno de {returnCandidate.beneficiariaNombre}.
                Esta acción cerrará su salida temporal.
              </span>
              <div className="warning-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setReturnCandidate(undefined)}
                >
                  Cancelar
                </button>
                <button
                  className="button primary"
                  type="button"
                  disabled={returnMutation.isPending}
                  onClick={() =>
                    returnMutation.mutate(returnCandidate.estanciaId)
                  }
                >
                  {returnMutation.isPending
                    ? "Confirmando…"
                    : "Confirmar retorno"}
                </button>
              </div>
            </div>
          ) : null}
          {returnMutation.error ? (
            <div className="alert error" role="alert">
              <strong>No fue posible registrar el retorno.</strong>
              <span>
                {apiMessage(returnMutation.error) ?? "Inténtalo nuevamente."}
              </span>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
