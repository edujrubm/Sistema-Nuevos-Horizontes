import { useCambiosPendientes } from "./useCambiosPendientes";
import { useCallback, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../shared/api/persona3";
import type { Ficha } from "../../shared/types/api";
import {
  ErrorVista,
  Cargando,
  valor,
  fechaInput,
  estadoTexto,
} from "../../shared/components/feedback";
import { useCapacidades } from "../../app/capacidades";
import { social, legal, referencia, guarderia } from "./campos";
import { useConsulta } from "./useConsulta";
export function EditorFicha({
  esReferencia = false,
  nueva = false,
}: {
  esReferencia?: boolean;
  nueva?: boolean;
}) {
  const { beneficiariaId = "", fichaId = "" } = useParams();
  const q = useConsulta(
    useCallback(
      (s: AbortSignal) =>
        nueva
          ? Promise.resolve(undefined)
          : esReferencia
            ? api.referencia(fichaId, s)
            : api.ficha(fichaId, s),
      [nueva, esReferencia, fichaId],
    ),
  );
  if (q.cargando) return <Cargando />;
  if (q.error) return <ErrorVista error={q.error} reintentar={q.recargar} />;
  return (
    <Editor
      key={beneficiariaId + "-" + fichaId + "-" + String(nueva)}
      inicial={q.datos}
      esReferencia={esReferencia}
      beneficiariaId={beneficiariaId}
      recargar={q.recargar}
    />
  );
}
export function Editor({
  inicial,
  esReferencia,
  beneficiariaId,
  recargar,
}: {
  inicial?: Ficha;
  esReferencia: boolean;
  beneficiariaId: string;
  recargar: () => void;
}) {
  const caps = useCapacidades();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(inicial);
  const [detalle, setDetalle] = useState<Record<string, unknown>>(
    inicial?.detalle || {},
  );
  const [atencion, setAtencion] = useState(fechaInput(inicial?.fechaAtencion));
  const [profesional, setProfesional] = useState(inicial?.profesionalId || "");
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState(false);
  const [correccion, setCorreccion] = useState(false);
  const [error, setError] = useState<unknown>();
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  const estado = ficha?.estadoCodigo || ficha?.estado;
  const borrador = !ficha || estado?.includes("BORRADOR");
  const puedeEditar = esReferencia
    ? ficha
      ? borrador
        ? caps.crearReferencia
        : caps.corregirReferencia && correccion
      : caps.crearReferencia
    : !ficha
      ? caps.crearFicha
      : borrador && caps.editarFicha;
  const puedeConfirmar = esReferencia
    ? caps.crearReferencia
    : caps.confirmarFicha;
  const campos = esReferencia
    ? referencia
    : ficha?.tipo === "LEGAL"
      ? legal
      : ficha?.tipo === "GUARDERIA"
        ? guarderia
        : social;
  const permitirNavegacion = useCambiosPendientes(dirty);
  function normalizar(d: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(d).map(([k, v]) => [
        k,
        v === ""
          ? null
          : k === "dependenciaEconomica"
            ? v === "true" || v === true
            : v,
      ]),
    );
  }
  function cambiar(k: string, v: string) {
    setDetalle((x) => ({ ...x, [k]: v }));
    setDirty(true);
    setMensaje("");
  }
  async function enviar(e: FormEvent, confirmar = false) {
    e.preventDefault();
    if (lock.current) return;
    if (confirmar && (!ficha || dirty || !confirmacion)) return;
    lock.current = true;
    setOcupado(true);
    setError(undefined);
    setMensaje("");
    try {
      let resultado: Ficha;
      if (confirmar) {
        const body = { version: ficha!.version, motivo };
        resultado = esReferencia
          ? await api.confirmarReferencia(ficha!.id, body)
          : await api.confirmarFicha(ficha!.id, body);
      } else if (ficha) {
        const body = {
          version: ficha.version,
          motivo,
          detalle: normalizar(detalle),
        };
        resultado = esReferencia
          ? await api.guardarReferencia(ficha.id, body)
          : await api.guardarFicha(ficha.id, body);
      } else {
        const body = {
          tipo: "SOCIAL",
          fechaAtencion: new Date(atencion).toISOString(),
          profesionalId: profesional,
          detalle: normalizar(detalle),
        };
        resultado = esReferencia
          ? await api.crearReferencia(beneficiariaId, {
              fechaAtencion: body.fechaAtencion,
              profesionalId: profesional,
              detalle: normalizar(detalle),
            })
          : await api.crearFicha(beneficiariaId, body);
      }
      setFicha(resultado);
      setDetalle(resultado.detalle);
      permitirNavegacion();
      setDirty(false);
      setMensaje(confirmar ? "Ficha confirmada." : "Borrador guardado.");
      setConfirmacion(false);
      setCorreccion(false);
      if (!ficha)
        navigate(
          `/beneficiarias/${beneficiariaId}/${esReferencia ? "referencias" : "fichas"}/${resultado.id}`,
          { replace: true },
        );
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setOcupado(false);
    }
  }
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            {esReferencia ? "Legal" : "Atención por área"}
          </p>
          <h1>
            {esReferencia
              ? "Referencia legal"
              : ficha?.tipo === "LEGAL"
                ? "Ficha legal"
                : ficha?.tipo === "GUARDERIA"
                  ? "Ficha de Guardería"
                  : "Ficha social"}
          </h1>
          <p>
            {ficha
              ? `Ficha ${ficha.id} · Versión ${ficha.version}`
              : "Nuevo borrador"}
          </p>
        </div>
        <span className="badge">{estadoTexto(estado)}</span>
      </div>
      {!borrador && (
        <p className="alert">
          Ficha confirmada.{" "}
          {esReferencia && caps.corregirReferencia
            ? "Las correcciones exigen un motivo y quedan en el historial."
            : "Consulta de solo lectura."}
        </p>
      )}
      {esReferencia &&
        ficha &&
        !borrador &&
        caps.corregirReferencia &&
        !correccion && (
          <button onClick={() => setCorreccion(true)}>
            Iniciar corrección
          </button>
        )}
      <ErrorVista error={error} />
      {error && (
        <button
          onClick={() => {
            if (
              !dirty ||
              window.confirm(
                "¿Descartar los cambios y cargar la versión vigente?",
              )
            )
              recargar();
          }}
        >
          Recargar versión vigente
        </button>
      )}
      {mensaje && (
        <p role="status" className="alert success">
          {mensaje}
        </p>
      )}
      <form onSubmit={enviar} className="card">
        <fieldset disabled={!puedeEditar || ocupado}>
          <legend>Datos de la atención</legend>
          {!ficha && (
            <div className="grid">
              <label>
                Fecha de atención
                <input
                  type="datetime-local"
                  required
                  value={atencion}
                  onChange={(e) => {
                    setAtencion(e.target.value);
                    setDirty(true);
                  }}
                />
              </label>
              <label>
                Identificador del profesional
                <input
                  required
                  pattern="[1-9][0-9]*"
                  value={profesional}
                  onChange={(e) => {
                    setProfesional(e.target.value);
                    setDirty(true);
                  }}
                />
              </label>
            </div>
          )}
          <div className="grid">
            {Object.entries(campos).map(([k, label]) => (
              <label key={k}>
                {label}
                {puedeEditar ? (
                  k === "dependenciaEconomica" ? (
                    <select
                      value={String(detalle[k] ?? "")}
                      onChange={(e) => cambiar(k, e.target.value)}
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : k.endsWith("Fecha") || k === "fechaRevision" ? (
                    <input
                      type="date"
                      value={String(detalle[k] || "").slice(0, 10)}
                      onChange={(e) => cambiar(k, e.target.value)}
                    />
                  ) : (
                    <textarea
                      maxLength={20000}
                      value={String(detalle[k] ?? "")}
                      onChange={(e) => cambiar(k, e.target.value)}
                      rows={3}
                    />
                  )
                ) : (
                  <span className="readonly">{valor(detalle[k])}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
        {(puedeEditar || (puedeConfirmar && borrador)) && ficha && (
          <label>
            Motivo del cambio o confirmación
            <input
              required
              minLength={3}
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
        )}
        <div className="actions">
          {puedeEditar && (
            <button className="primary" disabled={ocupado} type="submit">
              {ocupado ? "Guardando…" : "Guardar borrador o cambios"}
            </button>
          )}
        </div>
      </form>
      {ficha && borrador && puedeConfirmar && (
        <form className="card" onSubmit={(e) => enviar(e, true)}>
          <h2>Revisar y confirmar</h2>
          <p>
            Revisa los datos anteriores. Primero guarda los cambios pendientes.
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={confirmacion}
              onChange={(e) => setConfirmacion(e.target.checked)}
              required
            />
            He revisado la información y deseo confirmar esta ficha.
          </label>
          <label>
            Motivo de confirmación
            <input
              required
              minLength={3}
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
          <button
            className="primary"
            disabled={ocupado || dirty || !confirmacion}
          >
            Confirmar ficha
          </button>
        </form>
      )}
    </>
  );
}
