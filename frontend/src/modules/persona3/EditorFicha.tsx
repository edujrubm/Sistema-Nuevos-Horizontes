import { RiesgosCampo } from "./RiesgosCampo";
import { MarcoFicha, PestañasArea } from "./MarcoFicha";
import { secciones } from "./secciones";
import { useBeneficiaria, BarraBeneficiaria, useAreaFicha } from "./contexto";
import { useCambiosPendientes } from "./useCambiosPendientes";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
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
  if (q.datos?.tipo === "LEGAL" && !esReferencia)
    return (
      <Navigate
        replace
        to={`/beneficiarias/${beneficiariaId}/legal/${fichaId}`}
      />
    );
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
  const beneficiaria = useBeneficiaria();
  const { setArea } = useAreaFicha();
  const [pagina, setPagina] = useState(0);
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
  const tipo = ficha?.tipo || "SOCIAL";
  const paginas = secciones[tipo] || secciones.SOCIAL;
  useEffect(() => {
    setArea(
      esReferencia || tipo === "LEGAL"
        ? "Área Legal"
        : tipo === "GUARDERIA"
          ? "Guardería"
          : "Trabajo Social",
    );
    return () => setArea("");
  }, [tipo, esReferencia, setArea]);
  const camposVisibles = esReferencia
    ? campos
    : Object.fromEntries(
        paginas[pagina].campos.map((k) => [k, campos[k] || k]),
      );
  const textosLargos = new Set([
    "composicionFamiliar",
    "historiaViolencia",
    "redesApoyo",
    "diagnosticoSocial",
    "riesgosIdentificados",
    "planEliminacionRiesgos",
    "objetivoGeneral",
    "actividades",
    "evaluacion",
    "resultadosAlcanzados",
    "observaciones",
    "diagnosticoJuridico",
    "normativaAplicable",
    "planTratamiento",
    "inicioProcesoDescripcion",
    "actuacionesRealizadas",
    "diligenciamiento",
    "acuerdosProximosPasos",
    "motivoReferencia",
    "recomendaciones",
    "situacionSocioeconomica",
    "observacionesFamiliares",
    "enfermedadDetalle",
    "tratamiento",
    "indicacionesSalud",
  ]);
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
  const formulario = (
    <>
      <form onSubmit={enviar} className={esReferencia ? "card" : "ficha-form"}>
        <fieldset disabled={!puedeEditar || ocupado}>
          <legend>
            {esReferencia
              ? "Datos de la referencia"
              : tipo === "LEGAL"
                ? paginas[pagina].titulo
                : paginas[pagina].tarjeta}
          </legend>
          {!esReferencia && (
            <p className="count">
              Página {pagina + 1} de {paginas.length}
            </p>
          )}
          {pagina === 0 && ficha && (
            <div className="grid card registro">
              <h3 className="full">Datos del registro</h3>
              <label>
                Fecha de atención
                <span className="readonly">
                  {new Date(ficha.fechaAtencion).toLocaleString("es-GT")}
                </span>
              </label>
              <label>
                Profesional responsable
                <span className="readonly">{ficha.profesionalId}</span>
              </label>
            </div>
          )}
          {!esReferencia && tipo === "GUARDERIA" && pagina === 0 && (
            <div className="grid card">
              <label>
                Niña o niño vinculado
                <span className="readonly">
                  {ficha?.ninoId || "Sin registrar"}
                </span>
              </label>
              <label>
                Número de ficha inicial
                <span className="readonly">
                  {beneficiaria?.fichaInicial?.correlativo ||
                    beneficiaria?.fichaInicial?.id ||
                    "Sin registrar"}
                </span>
              </label>
              <label>
                Fecha de nacimiento
                <span className="readonly">Información no disponible</span>
              </label>
              <label>
                Etnia<span className="readonly">{valor(detalle.etniaId)}</span>
              </label>
              <label className="full">
                Dirección
                <span className="readonly">
                  {valor(beneficiaria?.residencia?.direccion)}
                </span>
              </label>
            </div>
          )}
          {!esReferencia && tipo === "GUARDERIA" && pagina === 1 && (
            <div className="notice">
              <strong>Personas autorizadas</strong>La información de traslado no
              está disponible para consulta. No se presume una autorización.
            </div>
          )}
          {!esReferencia && tipo === "GUARDERIA" && pagina === 3 && (
            <div className="grid">
              <label>
                Nombre de la madre
                <span className="readonly">
                  {beneficiaria?.nombre || "Consultar expediente"}
                </span>
              </label>
              <label>
                DPI/CUI de la madre
                <span className="readonly">
                  {beneficiaria?.cuiEnmascarado || "No disponible"}
                </span>
              </label>
              <label>
                Datos del padre
                <span className="readonly">
                  Información del padre no disponible
                </span>
              </label>
            </div>
          )}
          {esReferencia && (
            <div className="reference-person">
              <h3>Persona referida</h3>
              <div className="grid">
                <label>
                  Nombre
                  <span className="readonly">
                    {beneficiaria?.nombre ||
                      "Consultar expediente de la beneficiaria"}
                  </span>
                </label>
                <label>
                  DPI/CUI
                  <span className="readonly">
                    {beneficiaria?.cuiEnmascarado ||
                      "Protegido o no registrado"}
                  </span>
                </label>
                <label>
                  Fecha de nacimiento
                  <span className="readonly">
                    {beneficiaria?.fechaNacimiento || "Sin registrar"}
                  </span>
                </label>
                <label>
                  Número de referencia
                  <span className="readonly">
                    {ficha?.id || "Se asigna al guardar"}
                  </span>
                </label>
              </div>
            </div>
          )}
          {!ficha && (esReferencia || pagina === 0) && (
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
          <div className={esReferencia ? "grid" : "grid card"}>
            {!esReferencia && (
              <h3 className="full">{paginas[pagina].tarjeta}</h3>
            )}
            {tipo === "LEGAL" && pagina === 0 && (
              <label>
                Actora
                <span className="readonly">
                  {beneficiaria?.nombre || "Consultar expediente"}
                </span>
              </label>
            )}
            {Object.entries(camposVisibles).map(([k, label]) =>
              k === "riesgosIdentificados" ? (
                <RiesgosCampo
                  key={k}
                  value={String(detalle[k] ?? "")}
                  cambiar={(v) => cambiar(k, v)}
                  disabled={!puedeEditar || ocupado}
                />
              ) : (
                <label
                  key={k}
                  className={textosLargos.has(k) ? "full" : undefined}
                >
                  {label}
                  {puedeEditar ? (
                    k === "tipoVivienda" ? (
                      <select
                        value={String(detalle[k] ?? "")}
                        onChange={(e) => cambiar(k, e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        {["Alquilada", "Propia", "Prestada", "Temporal"].map(
                          (v) => (
                            <option key={v}>{v}</option>
                          ),
                        )}
                      </select>
                    ) : k === "dependenciaEconomica" ? (
                      <select
                        value={String(detalle[k] ?? "")}
                        onChange={(e) => cambiar(k, e.target.value)}
                      >
                        <option value="">Sin registrar</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : k.endsWith("Fecha") || k.startsWith("fecha") ? (
                      <input
                        type="date"
                        value={String(detalle[k] || "").slice(0, 10)}
                        onChange={(e) => cambiar(k, e.target.value)}
                      />
                    ) : !textosLargos.has(k) ? (
                      <input
                        maxLength={20000}
                        value={String(detalle[k] ?? "")}
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
              ),
            )}
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
      {ficha &&
        borrador &&
        puedeConfirmar &&
        (esReferencia || pagina === paginas.length - 1) && (
          <form className="card" onSubmit={(e) => enviar(e, true)}>
            <h2>Revisar y confirmar</h2>
            <p>
              Revisa los datos anteriores. Primero guarda los cambios
              pendientes.
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
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            {esReferencia ? "Legal" : "Atención por área"}
          </p>
          <h1>
            {esReferencia
              ? "Hoja de referencia"
              : ficha?.tipo === "LEGAL"
                ? "Área Legal"
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
      <BarraBeneficiaria />
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
      <PestañasArea
        beneficiariaId={beneficiariaId}
        area={tipo}
        referencia={esReferencia}
      />
      {esReferencia ? (
        <div className="reference-layout">
          <section>{formulario}</section>
          <aside className="summary reference-preview">
            <h2>Vista previa</h2>
            <p className="preview-heading">ASOCIACIÓN NUEVOS HORIZONTES</p>
            <h3>Hoja de referencia</h3>
            <dl>
              <dt>Número</dt>
              <dd>{ficha?.id || "Pendiente de guardar"}</dd>
              <dt>Persona referida</dt>
              <dd>{beneficiaria?.nombre || "Consultar expediente"}</dd>
              <dt>Destino</dt>
              <dd>{valor(detalle.destino)}</dd>
              <dt>Motivo</dt>
              <dd>{valor(detalle.motivoReferencia)}</dd>
              <dt>Recomendaciones</dt>
              <dd>{valor(detalle.recomendaciones)}</dd>
            </dl>
            <p className="helper">
              Vista del contenido actual. Los cambios pendientes aún no están
              guardados.
            </p>
          </aside>
        </div>
      ) : (
        <MarcoFicha paginas={paginas} pagina={pagina} cambiar={setPagina}>
          {formulario}
          <footer className="footer">
            <span>Las páginas pertenecen a la misma ficha.</span>
            <div className="actions">
              <button
                type="button"
                disabled={pagina === 0}
                onClick={() => setPagina(pagina - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className="primary"
                disabled={pagina === paginas.length - 1}
                onClick={() => setPagina(pagina + 1)}
              >
                Siguiente página
              </button>
            </div>
          </footer>
        </MarcoFicha>
      )}
    </>
  );
}
