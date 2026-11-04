import { BarraBeneficiaria } from "./contexto";
import { PestañasArea } from "./MarcoFicha";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/persona3";
import { useConsulta } from "./useConsulta";
import {
  Cargando,
  ErrorVista,
  Paginacion,
  fecha,
  valor,
  estadoTexto,
} from "../../shared/components/feedback";
import { useCapacidades } from "../../app/capacidades";
export function ListadoFichas({
  area,
}: {
  area: "trabajo-social" | "legal" | "referencias" | "guarderia";
}) {
  const { beneficiariaId = "", hijoId = "" } = useParams();
  const [pagina, setPagina] = useState(1);
  const caps = useCapacidades();
  const cargar = useCallback(
    (s: AbortSignal) =>
      area === "guarderia"
        ? api.infantiles(hijoId, pagina, s)
        : area === "referencias"
          ? api.referencias(beneficiariaId, pagina, s)
          : api.fichas(beneficiariaId, area, pagina, s),
    [area, beneficiariaId, hijoId, pagina],
  );
  const q = useConsulta(cargar);
  const base = `/beneficiarias/${beneficiariaId}`;
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Atención por área</p>
          <h1>
            {area === "trabajo-social"
              ? "Trabajo Social"
              : area === "referencias"
                ? "Referencias legales"
                : area === "guarderia"
                  ? "Ficha infantil"
                  : "Fichas legales"}
          </h1>
          <p>Consulta de fichas, estado y fecha de atención.</p>
        </div>
        {area === "trabajo-social" && caps.crearFicha && (
          <Link className="button primary" to={`${base}/social/nueva`}>
            Nueva ficha social
          </Link>
        )}
        {area === "referencias" && caps.crearReferencia && (
          <Link className="button primary" to={`${base}/referencias/nueva`}>
            Nueva referencia
          </Link>
        )}
      </div>
      <BarraBeneficiaria />
      <PestañasArea
        beneficiariaId={beneficiariaId}
        area={
          area === "legal"
            ? "LEGAL"
            : area === "guarderia"
              ? "GUARDERIA"
              : "SOCIAL"
        }
        referencia={area === "referencias"}
      />
      {area === "trabajo-social" && <ResumenSocial id={beneficiariaId} />}
      {q.cargando ? (
        <Cargando />
      ) : q.error ? (
        <ErrorVista error={q.error} reintentar={q.recargar} />
      ) : (
        <section className="card">
          <h2>Fichas del expediente</h2>
          {!q.datos?.datos.length ? (
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
                  {q.datos.datos.map((f) => (
                    <tr key={f.id}>
                      <td>
                        {f.tipo} · {f.id}
                      </td>
                      <td>{fecha(f.fechaAtencion)}</td>
                      <td>
                        <span className="badge">
                          {estadoTexto(f.estadoCodigo || f.estado)}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={
                            area === "referencias"
                              ? `${base}/referencias/${f.id}`
                              : `${base}/fichas/${f.id}`
                          }
                        >
                          Abrir ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {q.datos && <Paginacion {...q.datos} cambiar={setPagina} />}
        </section>
      )}
    </>
  );
}
function ResumenSocial({ id }: { id: string }) {
  const q = useConsulta(
    useCallback((s: AbortSignal) => api.resumen(id, s), [id]),
  );
  return (
    <section className="card">
      <h2>Resumen social</h2>
      {q.cargando ? (
        <Cargando />
      ) : q.error ? (
        <ErrorVista error={q.error} reintentar={q.recargar} />
      ) : (
        <div className="metrics">
          <div>
            <span>Fichas</span>
            <strong>{valor(q.datos?.totalFichas)}</strong>
          </div>
          <div>
            <span>Riesgos catalogados</span>
            <strong>
              {q.datos?.totalRiesgos == null
                ? "Pendiente de catálogo"
                : valor(q.datos.totalRiesgos)}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}
export function Guarderia() {
  const { beneficiariaId = "" } = useParams();
  const [pagina, setPagina] = useState(1);
  const q = useConsulta(
    useCallback(
      (s: AbortSignal) => api.hijos(beneficiariaId, pagina, s),
      [beneficiariaId, pagina],
    ),
  );
  return (
    <>
      <h1>Guardería</h1>
      <p>Solo se pueden abrir fichas de niñas y niños inscritos.</p>
      <BarraBeneficiaria />
      <PestañasArea beneficiariaId={beneficiariaId} area="GUARDERIA" />
      {q.cargando ? (
        <Cargando />
      ) : q.error ? (
        <ErrorVista error={q.error} reintentar={q.recargar} />
      ) : (
        <section className="card">
          <h2>Hijas e hijos del expediente</h2>
          {!q.datos?.datos.length && (
            <p className="empty">No hay hijas o hijos registrados.</p>
          )}
          <ul className="rows">
            {q.datos?.datos.map((h) => (
              <li key={h.ninoId}>
                <div>
                  <strong>{h.nombre}</strong>
                  <small>
                    {h.inscrito
                      ? "Inscripción confirmada"
                      : "Sin inscripción confirmada"}
                  </small>
                </div>
                {h.inscrito ? (
                  <Link
                    to={`/beneficiarias/${beneficiariaId}/guarderia/${h.ninoId}`}
                  >
                    Ver fichas
                  </Link>
                ) : (
                  <span className="badge">Consulta no disponible</span>
                )}
              </li>
            ))}
          </ul>
          {q.datos && <Paginacion {...q.datos} cambiar={setPagina} />}
        </section>
      )}
    </>
  );
}
