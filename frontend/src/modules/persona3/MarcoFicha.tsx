import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Seccion } from "./secciones";
export function PestañasArea({
  beneficiariaId,
  area,
  referencia = false,
}: {
  beneficiariaId: string;
  area: string;
  referencia?: boolean;
}) {
  const base = `/beneficiarias/${beneficiariaId}`;
  return (
    <nav className="tabs" aria-label="Vistas del área">
      <Link
        className="tab active"
        to={
          referencia
            ? `${base}/referencias`
            : area === "LEGAL"
              ? `${base}/legal`
              : area === "GUARDERIA"
                ? `${base}/guarderia`
                : `${base}/social`
        }
      >
        {referencia
          ? "Referencias legales"
          : area === "SOCIAL"
            ? "Ficha social"
            : "Ficha del área"}
      </Link>
      <Link className="tab" to={`${base}/evolucion`}>
        {area === "SOCIAL" ? "Seguimiento y hoja evolutiva" : "Hoja evolutiva"}
      </Link>
      <button
        className="tab"
        disabled
        title="Disponible con el módulo de documentos"
      >
        Documentos
      </button>
    </nav>
  );
}
export function MarcoFicha({
  paginas,
  pagina,
  cambiar,
  children,
}: {
  paginas: Seccion[];
  pagina: number;
  cambiar: (n: number) => void;
  children: ReactNode;
}) {
  return (
    <>
      <nav
        className="stepbar"
        style={{
          gridTemplateColumns: `repeat(${paginas.length},minmax(135px,1fr))`,
        }}
        aria-label="Secciones de la ficha"
      >
        {paginas.map((s, i) => (
          <button
            type="button"
            key={s.titulo}
            className={"step " + (pagina === i ? "active" : "")}
            aria-current={pagina === i ? "step" : undefined}
            aria-label={`${i + 1} ${s.titulo}`}
            onClick={() => cambiar(i)}
          >
            <span className="step-num">{i + 1}</span>
            <span>{s.titulo}</span>
          </button>
        ))}
      </nav>
      <div className="workspace">
        <section>{children}</section>
        <aside className="summary">
          <h2>Progreso de la ficha</h2>
          <div className="track">
            <div
              style={{ width: `${((pagina + 1) / paginas.length) * 100}%` }}
            />
          </div>
          <div className="progress-copy">
            <span>
              Página {pagina + 1} de {paginas.length}
            </span>
            <b>{Math.round(((pagina + 1) / paginas.length) * 100)} %</b>
          </div>
          <div className="summary-list">
            {paginas.map((s, i) => (
              <div
                key={s.titulo}
                className={"summary-item " + (pagina === i ? "active" : "")}
              >
                <i className="dot" />
                <span>{s.titulo}</span>
                <b>{pagina === i ? "Actual" : "Por revisar"}</b>
              </div>
            ))}
          </div>
          <div className="notice">
            <strong>Una sola ficha</strong>Las tarjetas agrupan apartados y las
            páginas reducen el desplazamiento. Navegar no guarda ni confirma la
            ficha.
          </div>
        </aside>
      </div>
    </>
  );
}
