import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { listShelterMovements } from "../api/albergue-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

function apiMessage(error: unknown) {
  return error instanceof ApiError ? error.body.mensaje : undefined;
}

function displayDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ShelterHistoryPage() {
  const [status, setStatus] = useState("TODOS");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const query = useQuery({ queryKey: ["shelter", "movements"], queryFn: ({ signal }) => listShelterMovements(signal) });
  const movements = useMemo(() => (query.data?.datos ?? []).filter((movement) => {
    if (status !== "TODOS" && movement.estadoMovimiento !== status) return false;
    const day = movement.fechaSalida.slice(0, 10);
    return (!from || day >= from) && (!to || day <= to);
  }), [query.data, status, from, to]);

  return <section>
    <PageHeader title="Historial de movimientos" description="Consulta los movimientos recientes de Albergue. Los filtros se aplican a los resultados cargados." action={<Link className="button secondary" to="/albergue">Volver a Albergue</Link>} />
    <div className="panel shelter-history-filters">
      <label>Estado<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="TODOS">Todos</option><option value="PENDIENTE">Retorno pendiente</option><option value="COMPLETADO">Retorno registrado</option></select></label>
      <label>Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
      <label>Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      {(status !== "TODOS" || from || to) ? <button className="button text" type="button" onClick={() => { setStatus("TODOS"); setFrom(""); setTo(""); }}>Limpiar filtros</button> : null}
    </div>
    {query.isLoading ? <p className="status-message" role="status">Cargando movimientos…</p> : null}
    {query.error ? <div className="alert error" role="alert"><strong>No fue posible cargar el historial.</strong><span>{apiMessage(query.error) ?? "Inténtalo nuevamente."}</span><button className="button secondary" type="button" onClick={() => void query.refetch()}>Reintentar</button></div> : null}
    {!query.isLoading && !query.error && movements.length === 0 ? <div className="empty-state panel"><h2>Sin movimientos</h2><p>No hay movimientos que coincidan con los filtros actuales.</p></div> : null}
    {movements.length > 0 ? <div className="panel table-panel"><table><thead><tr><th>Fecha de salida</th><th>Beneficiaria</th><th>Destino</th><th>Retorno</th><th>Estado</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.movimientoId}><td>{displayDateTime(movement.fechaSalida)}</td><td>{movement.beneficiariaNombre}</td><td>{movement.destino}</td><td>{movement.fechaRetorno ? displayDateTime(movement.fechaRetorno) : "Pendiente"}</td><td><span className={`status ${movement.estadoMovimiento === "PENDIENTE" ? "draft" : "active"}`}>{movement.estadoMovimiento === "PENDIENTE" ? "Pendiente" : "Completado"}</span></td></tr>)}</tbody></table></div> : null}
  </section>;
}
