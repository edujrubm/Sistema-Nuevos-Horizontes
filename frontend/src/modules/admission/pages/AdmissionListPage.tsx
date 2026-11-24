import { Fragment, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  discardAdmission,
  listAdmissions,
  type AdmissionListItem,
} from "../api/admission-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

interface AdmissionListPageProps {
  status: AdmissionListItem["estado"];
}

function formatDate(value: string | null) {
  if (!value) return "No registrada";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(date);
}

export function AdmissionListPage({ status }: AdmissionListPageProps) {
  const isDraft = status === "BORRADOR";
  const queryClient = useQueryClient();
  const [selectedDraft, setSelectedDraft] = useState<AdmissionListItem>();
  const [discardReason, setDiscardReason] = useState("");
  const query = useInfiniteQuery({
    queryKey: ["admissions", status],
    queryFn: ({ pageParam, signal }) =>
      listAdmissions(status, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.page.nextCursor ?? undefined,
  });
  const records = query.data?.pages.flatMap((page) => page.data) ?? [];
  const error = query.error instanceof ApiError ? query.error.body : undefined;
  const discardMutation = useMutation({
    mutationFn: () =>
      discardAdmission(
        selectedDraft!.id,
        selectedDraft!.version,
        discardReason.trim(),
      ),
    onSuccess: async () => {
      setSelectedDraft(undefined);
      setDiscardReason("");
      await queryClient.invalidateQueries({ queryKey: ["admissions", status] });
    },
  });
  const discardError =
    discardMutation.error instanceof ApiError
      ? discardMutation.error.body.mensaje
      : discardMutation.isError
        ? "No fue posible descartar el borrador."
        : undefined;

  return (
    <section>
      <PageHeader
        title={isDraft ? "Borradores de ficha inicial" : "Fichas confirmadas"}
        description={
          isDraft
            ? "Continúa las fichas pendientes desde el último dato guardado."
            : "Consulta las fichas iniciales que ya completaron el proceso de confirmación."
        }
        action={
          isDraft ? (
            <Link className="button primary" to="/fichas/nueva">
              Iniciar ficha inicial
            </Link>
          ) : undefined
        }
      />

      {query.isLoading && (
        <p className="status-message" role="status">
          Cargando fichas…
        </p>
      )}
      {error && (
        <div className="alert error" role="alert">
          <strong>No fue posible consultar las fichas.</strong>
          <span>{error.mensaje}</span>
          <small>Solicitud: {error.idSolicitud}</small>
        </div>
      )}
      {!query.isLoading && records.length === 0 && !error && (
        <div className="panel empty-state">
          <h2>
            {isDraft
              ? "No hay borradores pendientes"
              : "No hay fichas confirmadas"}
          </h2>
          <p>
            {isDraft
              ? "Las fichas que se inicien aparecerán aquí."
              : "Las fichas aparecerán aquí después de confirmarlas."}
          </p>
        </div>
      )}
      {records.length > 0 && (
        <div className="panel table-panel">
          <table>
            <thead>
              <tr>
                <th>Correlativo</th>
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Última actualización</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const discardOpen = selectedDraft?.id === record.id;
                return (
                  <Fragment key={record.id}>
                    <tr>
                      <td>{record.correlativo ?? `Ficha #${record.id}`}</td>
                      <td>{formatDate(record.fecha)}</td>
                      <td>{record.lugar ?? "No registrado"}</td>
                      <td>{formatDate(record.actualizadoEn)}</td>
                      <td>
                        <span
                          className={`status ${isDraft ? "draft" : "active"}`}
                        >
                          {isDraft ? "Borrador" : "Confirmada"}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="button text"
                          to={`/fichas/${record.id}`}
                        >
                          {isDraft ? "Continuar" : "Consultar"}
                        </Link>
                        {isDraft ? (
                          <button
                            className="button danger-outline"
                            type="button"
                            onClick={() => {
                              discardMutation.reset();
                              setSelectedDraft(record);
                              setDiscardReason("");
                            }}
                          >
                            Descartar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    {discardOpen ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="area-form-confirmation destructive area-form-list-discard">
                            <h3>Descartar borrador</h3>
                            <p>
                              Dejará de aparecer en la lista, pero se conservará
                              para auditoría. Esta acción no elimina
                              información.
                            </p>
                            {discardError ? (
                              <div className="alert error">
                                <strong>{discardError}</strong>
                              </div>
                            ) : null}
                            <label className="field">
                              <span>Motivo del descarte *</span>
                              <textarea
                                value={discardReason}
                                minLength={3}
                                maxLength={500}
                                required
                                onChange={(event) =>
                                  setDiscardReason(event.target.value)
                                }
                              />
                            </label>
                            <button
                              className="button text"
                              type="button"
                              onClick={() => setSelectedDraft(undefined)}
                            >
                              Conservar borrador
                            </button>
                            <button
                              className="button danger"
                              type="button"
                              disabled={
                                discardReason.trim().length < 3 ||
                                discardMutation.isPending
                              }
                              onClick={() => discardMutation.mutate()}
                            >
                              {discardMutation.isPending
                                ? "Descartando…"
                                : "Confirmar descarte"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {query.hasNextPage && (
            <div className="pagination-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? "Cargando…" : "Cargar más fichas"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
