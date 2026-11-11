import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getBeneficiary } from "@/modules/beneficiaries/api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import {
  anularDocumento,
  cargarDocumento,
  contextoDocumentos,
  descargarDocumento,
  listarDocumentos,
  validarPdf,
  versionesDocumentos,
  type Documento,
} from "./api";
import "./documentos.css";
import { PdfFileField } from "./PdfFileField";
export const bytes = (n: string | number) => {
  const value = Number(n),
    divisor = value < 1024 ? 1 : value < 1024 * 1024 ? 1024 : 1024 * 1024;
  return `${(value / divisor).toLocaleString("es-GT", { maximumFractionDigits: 2 })} ${divisor === 1 ? "B" : divisor === 1024 ? "KB" : "MB"}`;
};
const fecha = (s: string | null) =>
  s
    ? new Intl.DateTimeFormat("es-GT", {
        timeZone: "America/Guatemala",
        dateStyle: "medium",
      }).format(new Date(s.length === 10 ? s + "T12:00:00-06:00" : s))
    : "No registrada";
const mensaje = (e: unknown) =>
  e instanceof ApiError
    ? e.body.mensaje
    : "No se pudo completar la solicitud. Comprueba la conexión e intenta consultar de nuevo.";
export function DocumentsPage() {
  const { beneficiaryId = "" } = useParams();
  // Remontar al cambiar de caso impide mezclar archivos, filtros o solicitudes anteriores.
  return <DocumentsCase key={beneficiaryId} id={beneficiaryId} />;
}
export function DocumentsCase({ id }: { id: string }) {
  const client = useQueryClient();
  const [filtros, setFiltros] = useState({
    pagina: 1,
    buscar: "",
    categoria: "",
    estado: "",
  });
  const contexto = useQuery({
    queryKey: ["documentos", id, "contexto"],
    queryFn: ({ signal }) => contextoDocumentos(id, signal),
  });
  const persona = useQuery({
    queryKey: ["beneficiary", id],
    queryFn: ({ signal }) => getBeneficiary(id, signal),
  });
  const lista = useQuery({
    queryKey: ["documentos", id, "lista", filtros],
    queryFn: ({ signal }) => listarDocumentos(id, filtros, signal),
  });
  const [historial, setHistorial] = useState<Documento>();
  const versiones = useQuery({
    queryKey: ["documentos", id, "versiones", historial?.id],
    queryFn: ({ signal }) => versionesDocumentos(historial!.id, signal),
    enabled: !!historial,
  });
  const [panel, setPanel] = useState(false),
    [anterior, setAnterior] = useState<Documento>();
  const [formulario, setFormulario] = useState(""),
    [categoria, setCategoria] = useState(""),
    [dia, setDia] = useState(""),
    [descripcion, setDescripcion] = useState(""),
    [motivo, setMotivo] = useState("");
  const [archivo, setArchivo] = useState<File>(),
    [progreso, setProgreso] = useState(0),
    [ocupado, setOcupado] = useState(false),
    [incierto, setIncierto] = useState(false);
  const [error, setError] = useState(""),
    [exito, setExito] = useState(""),
    [candidato, setCandidato] = useState<Documento>(),
    [motivoAnular, setMotivoAnular] = useState("");
  const control = useRef<AbortController | null>(null);
  useEffect(() => () => control.current?.abort(), []);
  useEffect(() => {
    if (!ocupado) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [ocupado]);
  async function actualizar() {
    await client.invalidateQueries({ queryKey: ["documentos", id] });
  }
  function abrir(d?: Documento) {
    if (ocupado) return;
    setAnterior(d);
    setFormulario(d?.formularioId || "");
    setCategoria(d?.categoria || "");
    setDia("");
    setDescripcion("");
    setMotivo("");
    setArchivo(undefined);
    setPanel(true);
    setError("");
    setExito("");
  }
  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado || incierto) return;
    if (!archivo) {
      setError("Selecciona un archivo PDF.");
      return;
    }
    const invalid = validarPdf(archivo);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (
      !formulario ||
      !categoria.trim() ||
      !dia ||
      (anterior && !motivo.trim())
    ) {
      setError(
        "Completa la ficha, el tipo, la fecha y el motivo cuando corresponda.",
      );
      return;
    }
    const datos = new FormData();
    datos.append("archivo", archivo);
    datos.append("formularioId", formulario);
    datos.append("categoria", categoria.trim());
    datos.append(
      "nombreDocumento",
      anterior?.nombreDocumento || categoria.trim(),
    );
    datos.append("fechaDocumento", dia);
    datos.append("descripcion", descripcion);
    if (anterior) {
      datos.append("documentoAnteriorId", anterior.id);
      datos.append("motivoCambio", motivo.trim());
    }
    setOcupado(true);
    setError("");
    setExito("");
    setProgreso(0);
    control.current = new AbortController();
    try {
      await cargarDocumento(id, datos, setProgreso, control.current.signal);
      setPanel(false);
      setArchivo(undefined);
      setExito("Documento guardado correctamente como borrador.");
      await actualizar();
    } catch (e) {
      setError(mensaje(e));
      if (
        e instanceof ApiError &&
        e.body.codigo === "RESULTADO_OPERACION_INCIERTO"
      )
        setIncierto(true);
    } finally {
      setOcupado(false);
      control.current = null;
    }
  }
  async function descargar(d: Documento) {
    setError("");
    try {
      const blob = await descargarDocumento(d.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documento-${d.id}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setError(mensaje(e));
    }
  }
  async function anular() {
    if (!candidato || ocupado || !motivoAnular.trim()) return;
    setOcupado(true);
    setError("");
    try {
      await anularDocumento(candidato, motivoAnular.trim());
      setCandidato(undefined);
      setMotivoAnular("");
      setExito("Documento anulado. Se conserva el archivo y su historial.");
      await actualizar();
    } catch (e) {
      setError(mensaje(e));
    } finally {
      setOcupado(false);
    }
  }
  const c = contexto.data;
  const loadError = contexto.error || lista.error || persona.error;
  return (
    <div className="documentos-area">
      <div className="crumb">
        {c?.area || "Área"} /{" "}
        <Link to={`/beneficiarias/${id}`}>
          {persona.data?.nombre || "Expediente"}
        </Link>{" "}
        / Documentos
      </div>
      <div className="heading">
        <div>
          <h1>Documentos del área</h1>
          <p>Archivos, versiones y acciones autorizadas del caso.</p>
        </div>
        <button
          className="btn primary"
          disabled={!c?.capacidades.cargar || ocupado}
          onClick={() => abrir()}
        >
          + Agregar documento
        </button>
      </div>
      {!!error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {!!exito && (
        <div className="notice" role="status">
          {exito}
        </div>
      )}
      {loadError && (
        <div className="notice error" role="alert">
          {mensaje(loadError)}{" "}
          <button
            className="btn"
            onClick={() => {
              void actualizar();
              void persona.refetch();
            }}
          >
            Reintentar consulta
          </button>
        </div>
      )}
      {incierto && (
        <div className="notice">
          <strong>Carga sin confirmación</strong>
          <p>
            Revisa el listado y sus versiones antes de repetirla. Cancelar la
            conexión no garantiza que el servidor haya cancelado el guardado.
          </p>
          <button
            className="btn"
            disabled={lista.isFetching}
            onClick={async () => {
              const nuevos = {
                pagina: 1,
                buscar: "",
                categoria: "",
                estado: "",
              };
              try {
                await client.fetchQuery({
                  queryKey: ["documentos", id, "lista", nuevos],
                  queryFn: ({ signal }) => listarDocumentos(id, nuevos, signal),
                  staleTime: 0,
                });
                setFiltros(nuevos);
                setIncierto(false);
                setError(
                  "Consulta actualizada. Comprueba si el documento ya aparece antes de volver a cargarlo.",
                );
              } catch (e) {
                setError(mensaje(e));
              }
            }}
          >
            Consultar estado de documentos
          </button>
        </div>
      )}
      {panel && (
        <form className="notice" onSubmit={guardar}>
          <h2>{anterior ? "Nueva versión" : "Nuevo documento"}</h2>
          <fieldset disabled={ocupado || incierto}>
            <div className="grid three">
              <div>
                <label htmlFor="doc-ficha">Ficha correspondiente</label>
                <select
                  id="doc-ficha"
                  required
                  disabled={!!anterior}
                  value={formulario}
                  onChange={(e) => setFormulario(e.target.value)}
                >
                  <option value="">Selecciona una ficha</option>
                  {c?.formularios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.tipo} · #{f.id}
                      {f.ninoId ? ` · Niño #${f.ninoId}` : ""}
                    </option>
                  ))}
                </select>
                {!c?.formularios.length && (
                  <p>No hay fichas autorizadas para adjuntar documentos.</p>
                )}
              </div>
              <div>
                <label htmlFor="doc-tipo">Tipo de documento</label>
                <input
                  id="doc-tipo"
                  list="doc-tipos"
                  required
                  maxLength={200}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
                <datalist id="doc-tipos">
                  {c?.categorias.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="doc-fecha">Fecha del documento</label>
                <input
                  id="doc-fecha"
                  type="date"
                  required
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                />
              </div>
              <PdfFileField
                key={`${anterior?.id || "nuevo"}-${panel}`}
                id="doc-archivo"
                onChange={(file, error) => {
                  setArchivo(file);
                  setError(error);
                }}
              />
              <div className="full">
                <label htmlFor="doc-descripcion">Descripción</label>
                <input
                  id="doc-descripcion"
                  maxLength={20000}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              {anterior && (
                <div className="full">
                  <label htmlFor="doc-motivo">Motivo del cambio</label>
                  <input
                    id="doc-motivo"
                    required
                    maxLength={2000}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>
              )}
            </div>
          </fieldset>
          {ocupado && (
            <div role="status">
              <progress
                max={100}
                value={progreso}
                aria-label="Progreso de carga"
              />
              <p>
                {progreso === 100
                  ? "Archivo enviado. Esperando confirmación del servidor…"
                  : `Enviando ${progreso} %`}
              </p>
            </div>
          )}
          <div className="actions">
            {ocupado ? (
              <button
                className="btn"
                type="button"
                onClick={() => control.current?.abort()}
              >
                Cancelar envío
              </button>
            ) : (
              <button
                className="btn"
                type="button"
                onClick={() => setPanel(false)}
              >
                Cancelar
              </button>
            )}
            <button
              className="btn primary"
              disabled={
                ocupado || incierto || !archivo || !!validarPdf(archivo)
              }
            >
              {ocupado ? "Esperando confirmación…" : "Guardar documento"}
            </button>
          </div>
        </form>
      )}
      <section className="metric-row">
        {[
          ["Documentos activos", c?.resumen.documentosActivos],
          ["Versiones conservadas", c?.resumen.versionesConservadas],
          ["Pendientes de revisión", c?.resumen.pendientesRevision],
          ["Espacio utilizado", c ? bytes(c.resumen.tamanoBytes) : undefined],
        ].map(([t, v]) => (
          <article className="metric" key={t}>
            <span>{t}</span>
            <strong>{v ?? "—"}</strong>
          </article>
        ))}
      </section>
      <section className="card">
        <div className="grid three">
          <div>
            <label htmlFor="doc-buscar">Buscar documento</label>
            <input
              id="doc-buscar"
              placeholder="Nombre o tipo"
              value={filtros.buscar}
              onChange={(e) =>
                setFiltros({ ...filtros, buscar: e.target.value, pagina: 1 })
              }
            />
          </div>
          <div>
            <label htmlFor="doc-filtrar-tipo">Tipo</label>
            <select
              id="doc-filtrar-tipo"
              value={filtros.categoria}
              onChange={(e) =>
                setFiltros({ ...filtros, categoria: e.target.value, pagina: 1 })
              }
            >
              <option value="">Todos</option>
              {c?.categorias.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="doc-estado">Estado</label>
            <select
              id="doc-estado"
              value={filtros.estado}
              onChange={(e) =>
                setFiltros({ ...filtros, estado: e.target.value, pagina: 1 })
              }
            >
              <option value="">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>
        </div>
      </section>
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Documento",
                  "Tipo",
                  "Versión",
                  "Fecha",
                  "Estado",
                  "Acciones",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.data?.datos.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="person">
                      <div className="person-mark">PDF</div>
                      <div>
                        <strong>{d.nombreDocumento || d.categoria}</strong>
                        <small>{bytes(d.tamanoBytes)}</small>
                      </div>
                    </div>
                  </td>
                  <td>{d.categoria}</td>
                  <td>v{d.versionDocumento}</td>
                  <td>{fecha(d.fechaDocumento || d.cargadoEn)}</td>
                  <td>
                    <span
                      className={`tag ${d.anuladoEn ? "danger" : d.estadoRevisionCodigo === "BORRADOR" ? "warn" : "ok"}`}
                    >
                      {d.anuladoEn
                        ? "Anulado"
                        : d.estadoRevisionCodigo === "BORRADOR"
                          ? "Borrador"
                          : "Vigente"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn" onClick={() => setHistorial(d)}>
                        Versiones
                      </button>
                      <button
                        className="btn"
                        disabled={!!d.anuladoEn}
                        onClick={() => void descargar(d)}
                      >
                        Consultar
                      </button>
                      {!d.anuladoEn && (
                        <>
                          <button
                            className="btn"
                            disabled={ocupado || !c?.capacidades.cargar}
                            onClick={() => abrir(d)}
                          >
                            Nueva versión
                          </button>
                          {c?.capacidades.anular && (
                            <button
                              className="btn"
                              disabled={ocupado}
                              onClick={() => {
                                setCandidato(d);
                                setMotivoAnular("");
                              }}
                            >
                              Anular
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista.isLoading && <p role="status">Cargando documentos…</p>}
        {!lista.isLoading && !lista.error && lista.data?.total === 0 && (
          <p>No hay documentos con los filtros seleccionados.</p>
        )}
        <div className="actions">
          <span>
            {lista.data?.total ?? 0} documentos · Página {filtros.pagina}
          </span>
          <button
            className="btn"
            disabled={filtros.pagina === 1 || lista.isFetching}
            onClick={() =>
              setFiltros({ ...filtros, pagina: filtros.pagina - 1 })
            }
          >
            Anterior
          </button>
          <button
            className="btn"
            disabled={
              !lista.data ||
              filtros.pagina * 20 >= lista.data.total ||
              lista.isFetching
            }
            onClick={() =>
              setFiltros({ ...filtros, pagina: filtros.pagina + 1 })
            }
          >
            Siguiente
          </button>
        </div>
      </section>
      {historial && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Historial de versiones</h2>
              <p>{historial.nombreDocumento || historial.categoria}</p>
            </div>
            <button className="btn" onClick={() => setHistorial(undefined)}>
              Cerrar
            </button>
          </div>
          {versiones.isLoading && <p role="status">Cargando versiones…</p>}
          {versiones.error && (
            <div role="alert">
              {mensaje(versiones.error)}{" "}
              <button className="btn" onClick={() => void versiones.refetch()}>
                Reintentar
              </button>
            </div>
          )}
          <div className="timeline">
            {versiones.data?.datos.map((d) => (
              <div className="event" key={d.id}>
                <h3>
                  Versión {d.versionDocumento}
                  {d.anuladoEn ? " · Anulada" : ""}
                </h3>
                <p>
                  {d.motivoCambio ||
                    d.descripcion ||
                    "Sin descripción registrada."}
                </p>
                <time>
                  {fecha(d.cargadoEn)} ·{" "}
                  {d.autorNombre || `Usuario #${d.cargadoPor}`}
                </time>
                {d.motivoAnulacion && (
                  <p>Motivo de anulación: {d.motivoAnulacion}</p>
                )}
                <button
                  className="btn"
                  disabled={!!d.anuladoEn}
                  onClick={() => void descargar(d)}
                >
                  Consultar versión {d.versionDocumento}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {candidato && (
        <section
          className="notice"
          role="dialog"
          aria-modal="false"
          aria-label="Confirmar anulación"
        >
          <h2>Anular documento</h2>
          <p>
            {persona.data?.nombre} ·{" "}
            {candidato.nombreDocumento || candidato.categoria} · v
            {candidato.versionDocumento}. Se bloqueará su descarga; se
            conservarán el archivo y el historial. No es un borrado físico.
          </p>
          <label htmlFor="doc-anulacion">Motivo de anulación</label>
          <input
            id="doc-anulacion"
            maxLength={2000}
            value={motivoAnular}
            onChange={(e) => setMotivoAnular(e.target.value)}
          />
          <div className="actions">
            <button
              className="btn"
              disabled={ocupado}
              onClick={() => setCandidato(undefined)}
            >
              Cancelar
            </button>
            <button
              className="btn primary"
              disabled={ocupado || !motivoAnular.trim()}
              onClick={() => void anular()}
            >
              Confirmar anulación
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
