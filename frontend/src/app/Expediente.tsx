import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../shared/api/persona3";
import { useConsulta } from "../modules/persona3/useConsulta";
import { useBeneficiaria } from "../modules/persona3/contexto";
import { Cargando, ErrorVista } from "../shared/components/feedback";
export function Beneficiarias() {
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("");
  const [cursor, setCursor] = useState("");
  const [anteriores, setAnteriores] = useState<string[]>([]);
  const q = useConsulta(
    useCallback(
      (signal: AbortSignal) => api.beneficiarias(nombre, cursor, signal),
      [nombre, cursor],
    ),
  );
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Beneficiarias</h1>
          <p>Consulta y acceso al expediente institucional.</p>
        </div>
      </div>
      <form
        className="card filters"
        onSubmit={(e) => {
          e.preventDefault();
          setNombre(texto);
          setCursor("");
          setAnteriores([]);
        }}
      >
        <label>
          Buscar por nombre
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={200}
          />
        </label>
        <button className="primary">Buscar</button>
      </form>
      {q.cargando ? (
        <Cargando />
      ) : q.error ? (
        <ErrorVista error={q.error} reintentar={q.recargar} />
      ) : (
        <section className="card">
          <h2>Resultados</h2>
          {!q.datos?.data.length ? (
            <p className="empty">No se encontraron beneficiarias.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Beneficiaria</th>
                    <th>DPI/CUI</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {q.datos.data.map((b) => (
                    <tr key={b.id}>
                      <td>{b.nombre}</td>
                      <td>{b.cuiEnmascarado || "Protegido o sin registrar"}</td>
                      <td>
                        <Link to={`/beneficiarias/${b.id}`}>
                          Ver expediente
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <nav className="actions" aria-label="Paginación">
            <button
              disabled={!anteriores.length}
              onClick={() => {
                setCursor(anteriores.at(-1) || "");
                setAnteriores(anteriores.slice(0, -1));
              }}
            >
              Anterior
            </button>
            <button
              disabled={!q.datos?.page.hasMore}
              onClick={() => {
                setAnteriores([...anteriores, cursor]);
                setCursor(q.datos?.page.nextCursor || "");
              }}
            >
              Siguiente
            </button>
          </nav>
        </section>
      )}
    </>
  );
}
export function Expediente() {
  const b = useBeneficiaria();
  const { beneficiariaId = "" } = useParams();
  const base = `/beneficiarias/${beneficiariaId}`;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Expediente de {b?.nombre || "la beneficiaria"}</h1>
          <p>Datos generales y atención institucional.</p>
        </div>
        <Link className="button secondary" to="/beneficiarias">
          Volver
        </Link>
      </div>
      <nav className="tabs" aria-label="Secciones del expediente">
        <a
          className="tab active"
          href="#resumen-expediente"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("resumen-expediente")?.scrollIntoView();
          }}
        >
          Resumen
        </a>
        <button className="tab" disabled>
          Historial
        </button>
        <button className="tab" disabled>
          Hijas e hijos
        </button>
      </nav>
      <section id="resumen-expediente" className="card">
        <h2>Datos generales</h2>
        <div className="grid">
          <label>
            Nombre
            <span className="readonly">{b?.nombre || "Consultando…"}</span>
          </label>
          <label>
            DPI/CUI
            <span className="readonly">
              {b?.cuiEnmascarado || "Protegido o sin registrar"}
            </span>
          </label>
          <label>
            Fecha de nacimiento
            <span className="readonly">
              {b?.fechaNacimiento || "Sin registrar"}
            </span>
          </label>
          <label>
            Ficha inicial
            <span className="readonly">
              {b?.fichaInicial?.correlativo ||
                b?.fichaInicial?.id ||
                "Sin registrar"}
            </span>
          </label>
        </div>
      </section>
      <section className="card">
        <h2>Áreas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sección del expediente</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Trabajo Social", "social"],
                ["Psicología", ""],
                ["Medicina", ""],
                ["Área Legal", "legal"],
                ["Guardería", "guarderia"],
                ["Albergue", ""],
                ["Documentos", ""],
              ].map(([titulo, ruta]) => (
                <tr key={titulo}>
                  <th scope="row">{titulo}</th>
                  <td>
                    {ruta ? (
                      <Link to={`${base}/${ruta}`}>Consultar sección</Link>
                    ) : (
                      <button disabled>Consultar sección</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
