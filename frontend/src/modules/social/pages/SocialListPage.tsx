import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import {
  BarraBeneficiaria,
  useAreaFicha,
} from "@/shared/context/area-record-context";
import { useConsulta } from "@/shared/hooks/useConsulta";
import {
  Cargando,
  ErrorVista,
  Paginacion,
  estadoTexto,
  fecha,
} from "@/shared/components/feedback";
import { PestañasArea } from "@/modules/area-forms/components";
import type { Ficha } from "@/shared/types/api";
import { socialApi } from "../api/social-api";

function SocialSummary({ id }: { id: string }) {
  const query = useConsulta(
    useCallback((signal: AbortSignal) => socialApi.summary(id, signal), [id]),
  );
  return (
    <section className="card">
      <h2>Resumen social</h2>
      {query.cargando ? (
        <Cargando />
      ) : query.error ? (
        <ErrorVista error={query.error} reintentar={query.recargar} />
      ) : (
        <div className="metrics">
          <div>
            <span>Fichas</span>
            <strong>{query.datos?.totalFichas ?? 0}</strong>
          </div>
          <div>
            <span>Riesgos catalogados</span>
            <strong>
              {query.datos?.totalRiesgos ?? "Pendiente de catálogo"}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}

export function SocialListPage() {
  const { beneficiariaId = "" } = useParams();
  const [page, setPage] = useState(1);
  const [discard, setDiscard] = useState<Ficha>();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const locked = useRef(false);
  const { setArea } = useAreaFicha();
  useEffect(() => {
    setArea("Trabajo Social");
    return () => setArea("");
  }, [setArea]);
  const caps = useCapacidades();
  const query = useConsulta(
    useCallback(
      (signal: AbortSignal) => socialApi.list(beneficiariaId, page, signal),
      [beneficiariaId, page],
    ),
  );
  const base = `/beneficiarias/${beneficiariaId}/social`;
  async function discardDraft() {
    if (!discard || locked.current || reason.trim().length < 3) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await socialApi.discard(discard.id, discard.version, reason.trim());
      setDiscard(undefined);
      setReason("");
      query.recargar();
    } catch (failure) {
      setError(failure);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Trabajo Social</p>
          <h1>Ficha social</h1>
          <p>Consulta de fichas, estado y fecha de atención.</p>
        </div>
        {caps.crearFicha && (
          <Link className="button primary" to={base + "/nueva"}>
            Nueva ficha social
          </Link>
        )}
      </header>
      <BarraBeneficiaria />
      <PestañasArea beneficiariaId={beneficiariaId} area="SOCIAL" />
      <SocialSummary id={beneficiariaId} />
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
                          <td>SOCIAL · {record.id}</td>
                          <td>{fecha(record.fechaAtencion)}</td>
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
