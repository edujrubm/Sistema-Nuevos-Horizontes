import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import { BarraBeneficiaria } from "@/shared/context/area-record-context";
import { consultaDesdeQuery } from "@/shared/api/query-result";
import {
  Cargando,
  ErrorVista,
  Paginacion,
  estadoTexto,
  fecha,
} from "@/shared/components/feedback";
import { PestañasArea } from "@/modules/area-forms/components";
import type { Ficha } from "@/shared/types/api";
import { legalApi } from "../api/legal-api";

export function LegalListPage({ reference = false }: { reference?: boolean }) {
  const { beneficiariaId = "" } = useParams();
  const [page, setPage] = useState(1);
  const [discard, setDiscard] = useState<Ficha>();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const caps = useCapacidades();
  const query = consultaDesdeQuery(
    useQuery({
      queryKey: [
        "legal",
        "beneficiaria",
        beneficiariaId,
        "listado",
        reference,
        page,
      ],
      queryFn: ({ signal }) =>
        legalApi.list(beneficiariaId, reference, page, signal),
      enabled: Boolean(true),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const base = `/beneficiarias/${beneficiariaId}/${reference ? "referencias" : "legal"}`;
  const mutationClient = useQueryClient();
  const operation = useMutation({
    mutationKey: [
      "legal",
      "beneficiaria",
      beneficiariaId,
      "LegalListPage.tsx",
      "discardDraft",
    ],
    mutationFn: (args: Parameters<typeof executeDiscardDraft>) =>
      executeDiscardDraft(...args),
    retry: false,
    onSuccess: () => {
      void mutationClient.invalidateQueries({
        queryKey: ["legal", "beneficiaria", beneficiariaId],
        refetchType: "none",
      });

      // La elegibilidad para adjuntar PDF puede cambiar al guardar o confirmar la ficha.
      void mutationClient.invalidateQueries({
        queryKey: ["documentos", beneficiariaId, "contexto"],
        refetchType: "none",
      });
    },
  });
  const mutationGate = useRef(false);
  function discardDraft() {
    if (mutationGate.current) return Promise.resolve(undefined);
    mutationGate.current = true;
    return operation
      .mutateAsync([])
      .catch(() => undefined)
      .finally(() => {
        mutationGate.current = false;
      });
  }
  async function executeDiscardDraft() {
    if (!discard || busy || reason.trim().length < 3) return;
    setBusy(true);
    setError(undefined);
    try {
      await legalApi.discard(discard.id, discard.version, reason.trim());
      setDiscard(undefined);
      setReason("");
      query.recargar();
    } catch (failure) {
      setError(failure);
      throw failure;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Área Legal</p>
          <h1>{reference ? "Referencias legales" : "Fichas legales"}</h1>
          <p>Consulta de fichas, estado y fecha de atención.</p>
        </div>
        {(reference ? caps.crearReferencia : caps.crearFicha) && (
          <Link className="button primary" to={base + "/nueva"}>
            {reference ? "Nueva referencia" : "Nueva ficha legal"}
          </Link>
        )}
      </header>
      <BarraBeneficiaria />
      <PestañasArea
        beneficiariaId={beneficiariaId}
        area="LEGAL"
        referencia={reference}
      />
      <ErrorVista error={error} />
      {query.cargando ? (
        <Cargando />
      ) : query.error ? (
        <ErrorVista error={query.error} reintentar={query.recargar} />
      ) : (
        <section className="card">
          <h2>Fichas del expediente</h2>
          {!query.datos?.datos.length ? (
            <p className="empty">No hay fichas registradas.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ficha</th>
                    <th>Atención</th>
                    <th>Creación</th>
                    <th>Versión</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {query.datos.datos.map((record) => {
                    const draft = (
                      record.estadoCodigo ??
                      record.estado ??
                      ""
                    ).endsWith("BORRADOR");
                    return (
                      <Fragment key={record.id}>
                        <tr>
                          <td>{record.id}</td>
                          <td>{fecha(record.fechaAtencion)}</td>
                          <td>
                            {record.creadoEn
                              ? fecha(record.creadoEn)
                              : "Sin registrar"}
                          </td>
                          <td>{record.version}</td>
                          <td>
                            <span className="badge">
                              {estadoTexto(
                                record.estadoCodigo ?? record.estado,
                              )}
                            </span>
                          </td>
                          <td>
                            <Link to={base + "/" + record.id}>
                              {draft ? "Continuar" : "Consultar"}
                            </Link>
                            {!reference && draft && caps.editarFicha && (
                              <button
                                onClick={() => {
                                  setDiscard(record);
                                  setReason("");
                                  setError(undefined);
                                }}
                              >
                                Descartar borrador
                              </button>
                            )}
                          </td>
                        </tr>
                        {discard?.id === record.id && (
                          <tr>
                            <td colSpan={6}>
                              <section className="notice">
                                <h3>Descartar borrador {discard.id}</h3>
                                <label>
                                  Motivo del descarte
                                  <input
                                    minLength={3}
                                    maxLength={500}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                  />
                                </label>
                                <button
                                  disabled={busy || reason.trim().length < 3}
                                  onClick={() => void discardDraft()}
                                >
                                  Confirmar descarte
                                </button>
                                <button
                                  disabled={busy}
                                  onClick={() => setDiscard(undefined)}
                                >
                                  Cancelar
                                </button>
                              </section>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {query.datos && <Paginacion {...query.datos} cambiar={setPage} />}
        </section>
      )}
    </>
  );
}
