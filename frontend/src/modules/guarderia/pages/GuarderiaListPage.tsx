import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import {
  BarraBeneficiaria,
  useAreaFicha,
} from "@/shared/context/area-record-context";
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
import { guarderiaApi, childrenPage } from "../api/guarderia-api";

export function GuarderiaListPage() {
  const { beneficiariaId = "", hijoId = "" } = useParams();
  const [search] = useSearchParams();
  const childPage = childrenPage(search.get("paginaHijos"));
  const [page, setPage] = useState(1);
  const [discard, setDiscard] = useState<Ficha>();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const locked = useRef(false);
  const { setArea } = useAreaFicha();
  useEffect(() => {
    setArea("Guardería");
    return () => setArea("");
  }, [setArea]);
  const caps = useCapacidades();
  const query = consultaDesdeQuery(
    useQuery({
      queryKey: [
        "guarderia",
        "beneficiaria",
        beneficiariaId,
        "hijo",
        hijoId,
        "fichas",
        page,
        childPage,
      ],
      queryFn: ({ signal }) =>
        guarderiaApi.list(beneficiariaId, hijoId, page, childPage, signal),
      enabled: Boolean(true),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const base = `/beneficiarias/${beneficiariaId}/guarderia/fichas`;
  const mutationClient = useQueryClient();
  const operation = useMutation({
    mutationKey: [
      "guarderia",
      "beneficiaria",
      beneficiariaId,
      "GuarderiaListPage.tsx",
      "discardDraft",
    ],
    mutationFn: (args: Parameters<typeof executeDiscardDraft>) =>
      executeDiscardDraft(...args),
    retry: false,
    onSuccess: () => {
      void mutationClient.invalidateQueries({
        queryKey: ["guarderia", "beneficiaria", beneficiariaId],
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
    if (!discard || locked.current || reason.trim().length < 3) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await guarderiaApi.discard(discard.id, discard.version, reason.trim());
      setDiscard(undefined);
      setReason("");
      query.recargar();
    } catch (failure) {
      setError(failure);
      throw failure;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Guardería</p>
          <h1>Ficha de Guardería</h1>
          <p>Consulta de fichas, estado y fecha de atención.</p>
        </div>
        {caps.crearFicha && (
          <Link
            className="button primary"
            to={`/beneficiarias/${beneficiariaId}/guarderia/nueva?ninoId=${hijoId}&paginaHijos=${childPage}`}
          >
            Nueva ficha de Guardería
          </Link>
        )}
      </header>
      <BarraBeneficiaria />
      <PestañasArea beneficiariaId={beneficiariaId} area="GUARDERIA" />

      <ErrorVista error={error} />
      {query.cargando ? (
        <Cargando />
      ) : query.error ? (
        <ErrorVista error={query.error} reintentar={query.recargar} />
      ) : (
        <section className="card">
          <h2>Fichas de {query.datos?.child.nombre ?? "la niña o niño"}</h2>
          {!query.datos?.datos.length ? (
            <p className="empty">No hay fichas registradas.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ficha</th>
                    <th>Atención</th>
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
                          <td>GUARDERÍA · {record.id}</td>
                          <td>{fecha(record.fechaAtencion)}</td>
                          <td>
                            <span className="badge">
                              {estadoTexto(
                                record.estadoCodigo ?? record.estado,
                              )}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={
                                base +
                                "/" +
                                record.id +
                                "?paginaHijos=" +
                                childPage
                              }
                            >
                              {draft ? "Continuar" : "Consultar"}
                            </Link>
                            {draft && caps.editarFicha && (
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
                            <td colSpan={4}>
                              <section className="notice">
                                <h3>Descartar borrador {discard.id}</h3>
                                <label>
                                  Motivo del descarte
                                  <input
                                    minLength={3}
                                    maxLength={500}
                                    value={reason}
                                    onChange={(event) =>
                                      setReason(event.target.value)
                                    }
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
