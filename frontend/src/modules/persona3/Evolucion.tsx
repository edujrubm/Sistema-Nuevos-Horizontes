import { BarraBeneficiaria } from "./contexto";
import { useCambiosPendientes } from "./useCambiosPendientes";
import { useCallback, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/persona3";
import type { Entrada } from "../../shared/types/api";
import { useConsulta } from "./useConsulta";
import { useCapacidades } from "../../app/capacidades";
import {
  ErrorVista,
  Cargando,
  Paginacion,
  fecha,
  valor,
} from "../../shared/components/feedback";
export function Evolucion() {
  const { beneficiariaId = "" } = useParams();
  const caps = useCapacidades();
  const [parametros, setParametros] = useSearchParams();
  const [pagina, setPagina] = useState(1);
  const [area, setArea] = useState("");
  const [formularioId, setFormulario] = useState("");
  const [hijo, setHijo] = useState("");
  const [actual, setActual] = useState<Entrada | null | undefined>(
    parametros.has("historial") ? undefined : null,
  );
  const historial = parametros.get("historial") || undefined;
  function setHistorial(id?: string) {
    const siguientes = new URLSearchParams(parametros);
    if (id) siguientes.set("historial", id);
    else siguientes.delete("historial");
    setParametros(siguientes, { replace: true });
  }
  const filtro = new URLSearchParams({
    pagina: String(pagina),
    ...(area ? { area } : {}),
    ...(formularioId ? { formularioId } : {}),
    ...(hijo ? { hijoId: hijo } : {}),
  }).toString();
  const q = useConsulta(
    useCallback(
      (s: AbortSignal) => api.evolucion(beneficiariaId, filtro, s),
      [beneficiariaId, filtro],
    ),
  );
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Seguimiento del expediente</p>
          <h1>Hoja evolutiva</h1>
          <p>Entradas de tu área ordenadas por fecha de atención.</p>
        </div>
        {caps.crearEvolucion && (
          <button
            className="primary"
            onClick={() => {
              setActual(null);
              setHistorial(undefined);
            }}
          >
            Agregar seguimiento
          </button>
        )}
      </div>
      <BarraBeneficiaria />
      <section className="card filters">
        <label>
          Área
          <select
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setHijo("");
              setPagina(1);
            }}
          >
            <option value="">Área de la sesión</option>
            {[
              "Trabajo Social",
              "Legal",
              "Guardería",
              "Psicología",
              "Medicina",
            ].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Identificador de ficha
          <input
            value={formularioId}
            onChange={(e) => {
              setFormulario(e.target.value);
              setPagina(1);
            }}
            pattern="[1-9][0-9]*"
          />
        </label>
        {area === "Guardería" && (
          <label>
            Identificador del niño o niña
            <input
              value={hijo}
              onChange={(e) => {
                setHijo(e.target.value);
                setPagina(1);
              }}
            />
          </label>
        )}
      </section>
      <div className="evo-layout">
        <section>
          {" "}
          {actual !== undefined &&
            (actual ? caps.corregirEvolucion : caps.crearEvolucion) && (
              <EditorEntrada
                key={actual?.id || "nueva"}
                entrada={actual}
                beneficiariaId={beneficiariaId}
                cerrar={() => setActual(undefined)}
                guardar={() => {
                  setActual(undefined);
                  q.recargar();
                }}
              />
            )}
          {historial && (
            <Historial id={historial} cerrar={() => setHistorial(undefined)} />
          )}
          {q.cargando ? (
            <Cargando />
          ) : q.error ? (
            <ErrorVista error={q.error} reintentar={q.recargar} />
          ) : (
            <section className="card">
              <h2>Atenciones registradas</h2>
              {!q.datos?.datos.length && (
                <p className="empty">No hay seguimientos para estos filtros.</p>
              )}
              <ol className="timeline">
                {q.datos?.datos.map((e) => (
                  <li key={e.id}>
                    <div className="actions">
                      <time>{fecha(e.fechaAtencion)}</time>
                      <span className="badge">Versión {e.version}</span>
                    </div>
                    <h3>{e.accion}</h3>
                    <p>
                      Profesional: {e.profesionalNombre || e.profesionalId} ·
                      Ficha {e.formularioId}
                    </p>
                    <details>
                      <summary>Consultar contenido</summary>
                      <p className="preserve">{e.contenido}</p>
                      {e.planSeguimiento && <p>Plan: {e.planSeguimiento}</p>}
                      {e.resultado && <p>Resultado: {e.resultado}</p>}
                    </details>
                    <div className="actions">
                      {caps.corregirEvolucion && (
                        <button
                          onClick={() => {
                            setActual(e);
                            setHistorial(undefined);
                          }}
                        >
                          Corregir seguimiento
                        </button>
                      )}
                      {caps.verRevisiones && (
                        <button
                          onClick={() => {
                            setHistorial(e.id);
                            setActual(undefined);
                          }}
                        >
                          Ver historial
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {q.datos && <Paginacion {...q.datos} cambiar={setPagina} />}
            </section>
          )}
        </section>
        <aside className="summary">
          <h2>Reglas de la hoja</h2>
          <div className="summary-list">
            <div className="summary-item">
              <i className="dot" />
              <span>Acción realizada</span>
              <b>Obligatoria</b>
            </div>
            <div className="summary-item">
              <i className="dot" />
              <span>Registro cronológico</span>
              <b>Conservado</b>
            </div>
            <div className="summary-item">
              <i className="dot" />
              <span>Correcciones</span>
              <b>Con historial</b>
            </div>
          </div>
          <div className="notice">
            <strong>Privacidad por área</strong>Agregar una entrada no reemplaza
            ni elimina las anteriores.
          </div>
        </aside>
      </div>
    </>
  );
}
export function EditorEntrada({
  entrada,
  beneficiariaId,
  cerrar,
  guardar,
}: {
  entrada: Entrada | null;
  beneficiariaId: string;
  cerrar: () => void;
  guardar: () => void;
}) {
  const [formulario, setFormulario] = useState(entrada?.formularioId || "");
  const [accion, setAccion] = useState(entrada?.accion || "");
  const [contenido, setContenido] = useState(entrada?.contenido || "");
  const [atencion, setAtencion] = useState(
    entrada
      ? new Date(
          new Date(entrada.fechaAtencion).getTime() -
            new Date(entrada.fechaAtencion).getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)
      : "",
  );
  const [profesional, setProfesional] = useState(entrada?.profesionalId || "");
  const [plan, setPlan] = useState(entrada?.planSeguimiento || "");
  const [resultado, setResultado] = useState(entrada?.resultado || "");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<unknown>();
  const [ocupado, setOcupado] = useState(false);
  const lock = useRef(false);
  const [dirty, setDirty] = useState(false);
  const permitirNavegacion = useCambiosPendientes(dirty);
  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setOcupado(true);
    setError(undefined);
    try {
      const body = {
        accion,
        contenido,
        fechaAtencion: new Date(atencion).toISOString(),
        profesionalId: profesional,
        planSeguimiento: plan || null,
        resultado: resultado || null,
      };
      if (entrada)
        await api.corregirEntrada(entrada.id, {
          ...body,
          version: entrada.version,
          motivo,
        });
      else
        await api.crearEntrada(beneficiariaId, {
          ...body,
          formularioId: formulario,
        });
      permitirNavegacion();
      setDirty(false);
      guardar();
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
      lock.current = false;
    }
  }
  return (
    <form className="card" onSubmit={enviar} onChange={() => setDirty(true)}>
      <h2>{entrada ? "Corregir seguimiento" : "Nuevo seguimiento"}</h2>
      <ErrorVista error={error} />
      <fieldset disabled={ocupado}>
        <div className="grid">
          <label>
            Identificador de ficha confirmada
            <input
              required
              disabled={!!entrada}
              pattern="[1-9][0-9]*"
              value={formulario}
              onChange={(e) => setFormulario(e.target.value)}
            />
          </label>
          <label>
            Fecha de atención
            <input
              required
              type="datetime-local"
              value={atencion}
              onChange={(e) => setAtencion(e.target.value)}
            />
          </label>
          <label>
            Identificador del profesional
            <input
              required
              pattern="[1-9][0-9]*"
              value={profesional}
              onChange={(e) => setProfesional(e.target.value)}
            />
          </label>
          <label>
            Acción realizada
            <input
              required
              maxLength={200}
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
            />
          </label>
          <label>
            Seguimiento
            <textarea
              required
              maxLength={20000}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
            />
          </label>
          <label>
            Plan de seguimiento
            <textarea
              maxLength={20000}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            />
          </label>
          <label>
            Resultado
            <textarea
              maxLength={20000}
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
            />
          </label>
          {entrada && (
            <label>
              Motivo de la corrección
              <input
                required
                maxLength={2000}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
          )}
        </div>
      </fieldset>
      <div className="actions">
        <button type="submit" className="primary" disabled={ocupado}>
          {ocupado ? "Guardando…" : "Guardar seguimiento"}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            if (window.confirm("¿Descartar los datos de este seguimiento?"))
              cerrar();
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
export function Historial({ id, cerrar }: { id: string; cerrar: () => void }) {
  const [pagina, setPagina] = useState(1);
  const q = useConsulta(
    useCallback(
      (s: AbortSignal) => api.revisiones(id, pagina, s),
      [id, pagina],
    ),
  );
  return (
    <section className="card">
      <div className="page-head">
        <h2>Historial de revisiones</h2>
        <button onClick={cerrar}>Cerrar historial</button>
      </div>
      {q.cargando ? (
        <Cargando />
      ) : q.error ? (
        <ErrorVista error={q.error} reintentar={q.recargar} />
      ) : (
        <>
          {!q.datos?.datos.length && <p>No hay revisiones disponibles.</p>}
          {q.datos?.datos.map((r, i) => (
            <article className="revision" key={r.id || i}>
              <h3>{r.operacion === "INSERT" ? "Creación" : "Corrección"}</h3>
              <p>
                {r.autor.nombre || r.autor.usuarioId} ·{" "}
                {r.fecha ? fecha(r.fecha) : "Fecha no disponible"}
              </p>
              <p>Motivo: {r.motivo}</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Antes</th>
                      <th>Después</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.cambios.map((c) => (
                      <tr key={c.campo}>
                        <th>{c.campo}</th>
                        <td>{valor(c.antes)}</td>
                        <td>{valor(c.despues)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
          {q.datos && <Paginacion {...q.datos} cambiar={setPagina} />}
        </>
      )}
    </section>
  );
}
