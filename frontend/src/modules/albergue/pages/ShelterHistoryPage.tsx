import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listShelterHistory } from "../api/albergue-api";
import { PageHeader } from "@/shared/components/PageHeader";
export const tiposMovimiento: Record<string, string> = {
  INGRESO: "Ingreso",
  SALIDA_TEMPORAL: "Salida temporal",
  RETORNO: "Retorno",
  EGRESO: "Egreso",
  NACIMIENTO: "Nacimiento",
};
export function ShelterHistoryPage() {
  const [tipo, setTipo] = useState(""),
    [desde, setDesde] = useState(""),
    [hasta, setHasta] = useState("");
  const [filtros, setFiltros] = useState({
    pagina: 1,
    tipo: "",
    desde: "",
    hasta: "",
  });
  const q = useQuery({
    queryKey: ["shelter", "history", filtros],
    queryFn: ({ signal }) => listShelterHistory(filtros, signal),
  });
  const invalid = !!desde && !!hasta && desde > hasta;
  return (
    <section>
      <PageHeader
        title="Historial de movimientos"
        description="Consulta ingresos, salidas temporales, retornos y egresos."
        action={
          <Link className="button secondary" to="/albergue">
            Volver a Albergue
          </Link>
        }
      />
      <section className="panel form-panel">
        <form
          className="form-grid shelter-history-filters"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid) setFiltros({ pagina: 1, tipo, desde, hasta });
          }}
        >
          <label>
            Tipo de movimiento
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(tiposMovimiento).map(([v, t]) => (
                <option value={v} key={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </label>
          <button className="button primary" disabled={invalid}>
            Aplicar filtros
          </button>
          {invalid && (
            <p role="alert">
              La fecha inicial no puede ser posterior a la final.
            </p>
          )}
        </form>
      </section>
      {q.isLoading && <p role="status">Cargando historial…</p>}
      {q.error && (
        <div className="alert error" role="alert">
          No fue posible consultar el historial.{" "}
          <button className="button secondary" onClick={() => void q.refetch()}>
            Reintentar
          </button>
        </div>
      )}
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Persona</th>
                <th>Movimiento</th>
                <th>Responsable</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {q.data?.datos.map((m) => (
                <tr key={m.id}>
                  <td>
                    {new Intl.DateTimeFormat("es-GT", {
                      timeZone: "America/Guatemala",
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(m.fecha))}
                  </td>
                  <td>{m.beneficiariaNombre}</td>
                  <td>{tiposMovimiento[m.tipo] || m.tipo}</td>
                  <td>{m.responsable}</td>
                  <td>{m.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {q.data?.datos.length === 0 && (
          <p>No hay movimientos con los filtros seleccionados.</p>
        )}
        <div className="form-actions">
          <span>
            {q.data?.paginacion.total ?? 0} movimientos · Página{" "}
            {filtros.pagina}
          </span>
          <button
            className="button secondary"
            disabled={filtros.pagina === 1 || q.isFetching}
            onClick={() =>
              setFiltros({ ...filtros, pagina: filtros.pagina - 1 })
            }
          >
            Anterior
          </button>
          <button
            className="button secondary"
            disabled={
              !q.data ||
              filtros.pagina >= q.data.paginacion.totalPaginas ||
              q.isFetching
            }
            onClick={() =>
              setFiltros({ ...filtros, pagina: filtros.pagina + 1 })
            }
          >
            Siguiente
          </button>
        </div>
      </section>
      <p>
        El historial auditado comienza al aplicar la migración de trazabilidad;
        no se inventan autores ni horas de registros anteriores.
      </p>
    </section>
  );
}
