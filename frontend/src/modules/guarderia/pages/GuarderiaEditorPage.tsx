import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { NumeroFichaInicialMadre } from "../components/NumeroFichaInicialMadre";
import { ContextoMaternoGuarderia } from "../components/ContextoMaternoGuarderia";
import { PadresGuarderia } from "../components/PadresGuarderia";
import { ResponsablesGuarderia } from "../components/ResponsablesGuarderia";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useCapacidades } from "@/app/capacidades";
import {
  BarraBeneficiaria,
  useAreaFicha,
  useBeneficiaria,
} from "@/shared/context/area-record-context";
import {
  Cargando,
  ErrorVista,
  estadoTexto,
} from "@/shared/components/feedback";
import { FormErrorSummary } from "@/shared/components/forms";
import { MarcoFicha, PestañasArea } from "@/modules/area-forms/components";
import {
  guarderiaFields,
  guarderiaSections,
  tarjetasGuarderia,
} from "../guarderia-form.config";
import { consultaDesdeQuery } from "@/shared/api/query-result";
import { Paginacion } from "@/shared/components/feedback";
import { guarderiaApi, childrenPage } from "../api/guarderia-api";
import { useGuarderiaEditor } from "../hooks/useGuarderiaEditor";

import { DatosMadreGuarderia } from "../components/DatosMadreGuarderia";

const shortFields = new Set([
  "numeroFicha",
  "fechaIngreso",
  "etniaId",
  "escolaridadId",
  "lugarEstudio",
  "telefonoEscuela",
  "padeceEnfermedad",
]);
const fieldId = (field: string) => `guarderia-${field.replaceAll(".", "-")}`;

export function GuarderiaEditorPage() {
  const { beneficiariaId = "", fichaId = "" } = useParams();
  const [search, setSearch] = useSearchParams();
  const childPage = childrenPage(search.get("paginaHijos"));
  const children = consultaDesdeQuery(
    useQuery({
      queryKey: [
        "guarderia",
        "beneficiaria",
        beneficiariaId,
        "hijos",
        childPage,
      ],
      queryFn: ({ signal }) =>
        guarderiaApi.children(beneficiariaId, childPage, signal),
      enabled: Boolean(true),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const catalogs = consultaDesdeQuery(
    useQuery({
      queryKey: ["guarderia", "catalogos", "ficha"],
      queryFn: ({ signal }) => guarderiaApi.catalogs(signal),
      enabled: Boolean(true),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const editor = useGuarderiaEditor(beneficiariaId, fichaId);
  const child = children.datos?.datos.find((n) => n.ninoId === editor.ninoId);
  const options = (field: string) =>
    field === "etniaId"
      ? (catalogs.datos?.etnias ?? [])
      : (catalogs.datos?.escolaridades ?? []);

  const person = useBeneficiaria();
  const { setArea } = useAreaFicha();
  useEffect(() => {
    setArea("Guardería");
    return () => setArea("");
  }, [setArea]);
  const caps = useCapacidades();
  const [page, setPage] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const [responsablesDirty, setResponsablesDirty] = useState(false);
  const [padresDirty, setPadresDirty] = useState(false);
  useEffect(
    () => editor.setAuxiliaryDirty(responsablesDirty || padresDirty),
    [responsablesDirty, padresDirty, editor.setAuxiliaryDirty],
  );
  const canEdit =
    editor.draft && (editor.record ? caps.editarFicha : caps.crearFicha);
  const editable =
    canEdit &&
    !editor.busy &&
    !editor.conflict &&
    !editor.uncertain &&
    (!!editor.record || !!child);
  const errors =
    editor.error instanceof ApiError ? editor.error.body.errores : [];
  const grouped = new Map<string, string[]>();
  for (const error of errors)
    grouped.set(error.campo, [
      ...(grouped.get(error.campo) ?? []),
      error.mensaje,
    ]);
  const labels: Record<string, string> = {
    fechaAtencion: "Fecha de atención",
    profesionalId: "Identificador del profesional",
    ...Object.fromEntries(
      Object.entries(guarderiaFields).map(([key, label]) => [
        `detalle.${key}`,
        label,
      ]),
    ),
  };
  const fieldError = (field: string) => grouped.get(field)?.join(" ");
  function change(field: string, value: string) {
    setReviewed(false);
    editor.change(field, value);
  }
  const accessibility = (field: string) => ({
    id: fieldId(field),
    "aria-label": labels[field],
    "aria-invalid": Boolean(fieldError(field)) || undefined,
    "aria-describedby": fieldError(field)
      ? fieldId(field) + "-error"
      : undefined,
  });
  const errorText = (field: string) =>
    fieldError(field) ? (
      <span className="field-error" id={fieldId(field) + "-error"}>
        {fieldError(field)}
      </span>
    ) : null;
  function focusField(id: string) {
    const section = guarderiaSections.findIndex((section) =>
      section.campos.some((field) => fieldId(`detalle.${field}`) === id),
    );
    if (section >= 0) setPage(section);
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  }
  if (editor.cargando) return <Cargando />;
  if (editor.error && !editor.record && fichaId)
    return <ErrorVista error={editor.error} reintentar={editor.reload} />;
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Guardería</p>
          <h1>Ficha de Guardería</h1>
        </div>
        <span className="badge">
          {estadoTexto(editor.record?.estadoCodigo ?? editor.record?.estado)}
        </span>
      </header>
      <BarraBeneficiaria />
      <PestañasArea beneficiariaId={beneficiariaId} area="GUARDERIA" />
      {editor.auxiliaryDirty && (
        <div className="alert" role="status">
          Hay una captura pendiente en{" "}
          {padresDirty ? "Madre y padre" : "Traslado"}. Guárdala o cancélala
          antes de guardar la ficha.
          <button type="button" onClick={() => setPage(padresDirty ? 3 : 1)}>
            Volver a la captura pendiente
          </button>
        </div>
      )}
      <FormErrorSummary
        errors={[...grouped].map(([field, messages]) => ({
          fieldId: fieldId(field),
          label: labels[field] ?? field,
          message: messages.join(" "),
        }))}
        requestId={
          editor.error instanceof ApiError
            ? editor.error.body.idSolicitud
            : undefined
        }
        onFieldClick={focusField}
      />
      <ErrorVista
        error={errors.length ? undefined : editor.error}
        reintentar={
          editor.conflict || editor.uncertain ? editor.reload : undefined
        }
      />
      {editor.message && <p role="status">{editor.message}</p>}
      {!editor.draft && <p className="alert">Registro en modo de consulta.</p>}
      {(editor.record?.estadoCodigo ?? editor.record?.estado ?? "").endsWith(
        "CONFIRMADO",
      ) && (
        <div className="actions">
          <Link
            className="button secondary"
            to={`/beneficiarias/${beneficiariaId}/documentos?tipo=GUARDERIA&formularioId=${editor.record!.id}`}
          >
            Adjuntar PDF
          </Link>
        </div>
      )}
      <ErrorVista error={children.error} reintentar={children.recargar} />
      <ErrorVista error={catalogs.error} reintentar={catalogs.recargar} />
      {!editor.record && (
        <section className="card">
          <h2>Seleccionar niña o niño</h2>
          <label>
            Niña o niño vinculado
            <select
              value={editor.ninoId}
              disabled={children.cargando || !!children.error}
              onChange={(event) => editor.setNinoId(event.target.value)}
            >
              <option value="">Seleccionar</option>
              {children.datos?.datos.map((n) => (
                <option key={n.ninoId} value={n.ninoId}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
          {children.datos && (
            <Paginacion
              {...children.datos}
              cambiar={(page) => {
                editor.setNinoId("");
                setSearch((current) => {
                  const next = new URLSearchParams(current);
                  next.set("paginaHijos", String(page));
                  next.delete("ninoId");
                  return next;
                });
              }}
            />
          )}
        </section>
      )}
      <MarcoFicha paginas={guarderiaSections} pagina={page} cambiar={setPage}>
        <form
          className="ficha-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (editable) {
              setReviewed(false);
              void editor.submit();
            }
          }}
        >
          <fieldset disabled={!editable || editor.auxiliaryDirty}>
            <legend>{guarderiaSections[page].titulo}</legend>
            <p className="count">
              Página {page + 1} de {guarderiaSections.length}
            </p>
            {page === 0 && (
              <div className="grid card registro">
                <label>
                  Niña o niño vinculado
                  <span className="readonly">
                    {child?.nombre ?? editor.ninoId ?? "Sin seleccionar"}
                  </span>
                </label>
                <NumeroFichaInicialMadre
                  persona={person}
                  etiqueta="Número de ficha inicial"
                />
                <label>
                  Fecha de nacimiento
                  <span className="readonly">
                    {child?.fechaNac ?? "Información no disponible"}
                  </span>
                </label>
                <label>
                  Dirección
                  <span className="readonly">
                    {String(
                      person?.residencia?.direccionActual ?? "Sin registrar",
                    )}
                  </span>
                </label>
              </div>
            )}
            {page === 1 && !editor.record && (
              <p className="empty">
                Guarda primero el borrador de la ficha para registrar
                responsables autorizados.
              </p>
            )}
            {page === 2 && (
              <div className="grid card">
                <NumeroFichaInicialMadre persona={person} />
                <ContextoMaternoGuarderia persona={person} />
              </div>
            )}
            {page === 3 && (
              <div className="grid card">
                <DatosMadreGuarderia persona={person} />
              </div>
            )}
            <div className="grid">
              <label>
                Fecha de atención
                <input
                  required
                  type="datetime-local"
                  {...accessibility("fechaAtencion")}
                  value={editor.attention}
                  onChange={(event) => {
                    setReviewed(false);
                    editor.setAttention(event.target.value);
                  }}
                />
                {errorText("fechaAtencion")}
              </label>
              <label>
                Identificador del profesional
                <input
                  required
                  pattern="[0-9]+"
                  {...accessibility("profesionalId")}
                  value={editor.professional}
                  onChange={(event) => {
                    setReviewed(false);
                    editor.setProfessional(event.target.value);
                  }}
                />
                {errorText("profesionalId")}
              </label>
            </div>
            {tarjetasGuarderia(page).map((tarjeta) => (
              <div key={tarjeta.tarjeta} className="grid card">
                <h3 className="full">{tarjeta.tarjeta}</h3>
                {tarjeta.campos.map((field) => (
                  <label
                    key={field}
                    className={shortFields.has(field) ? undefined : "full"}
                  >
                    {guarderiaFields[field]}
                    {!editable ? (
                      <span className="readonly">
                        {editor.detail[field] === true
                          ? "Sí"
                          : editor.detail[field] === false
                            ? "No"
                            : field === "etniaId" || field === "escolaridadId"
                              ? (options(field).find(
                                  (o) => o.id === editor.detail[field],
                                )?.nombre ?? "Sin registrar")
                              : String(editor.detail[field] ?? "Sin registrar")}
                      </span>
                    ) : field === "padeceEnfermedad" ? (
                      <select
                        {...accessibility(`detalle.${field}`)}
                        value={String(editor.detail[field] ?? "")}
                        onChange={(event) => change(field, event.target.value)}
                      >
                        <option value="">Sin registrar</option>
                        {["true", "false"].map((value) => (
                          <option key={value} value={value}>
                            {value === "true"
                              ? "Sí"
                              : value === "false"
                                ? "No"
                                : value}
                          </option>
                        ))}
                      </select>
                    ) : field === "etniaId" || field === "escolaridadId" ? (
                      <select
                        {...accessibility(`detalle.${field}`)}
                        value={String(editor.detail[field] ?? "")}
                        disabled={catalogs.cargando || !!catalogs.error}
                        onChange={(event) => change(field, event.target.value)}
                      >
                        <option value="">Sin registrar</option>
                        {editor.detail[field] &&
                        !options(field).some(
                          (o) => o.id === editor.detail[field],
                        ) ? (
                          <option value={String(editor.detail[field])}>
                            Opción registrada no disponible
                          </option>
                        ) : null}
                        {options(field).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.nombre ?? option.id}
                          </option>
                        ))}
                      </select>
                    ) : shortFields.has(field) ? (
                      <input
                        type={field.startsWith("fecha") ? "date" : "text"}
                        maxLength={20000}
                        {...accessibility(`detalle.${field}`)}
                        value={String(editor.detail[field] ?? "")}
                        onChange={(event) => change(field, event.target.value)}
                      />
                    ) : (
                      <textarea
                        rows={3}
                        maxLength={20000}
                        {...accessibility(`detalle.${field}`)}
                        value={String(editor.detail[field] ?? "")}
                        onChange={(event) => change(field, event.target.value)}
                      />
                    )}
                    {errorText(`detalle.${field}`)}
                  </label>
                ))}
              </div>
            ))}
          </fieldset>
          {canEdit && (
            <div className="actions">
              <button
                className="primary"
                type="submit"
                disabled={!editable || editor.auxiliaryDirty}
              >
                Guardar borrador
              </button>
            </div>
          )}
        </form>
        {editor.record && (
          <ResponsablesGuarderia
            key={editor.record.id}
            beneficiariaId={beneficiariaId}
            fichaId={editor.record.id}
            version={editor.record.version}
            visible={page === 1}
            editable={editable && !editor.dirty}
            onSaved={editor.acceptVersion}
            onDirty={setResponsablesDirty}
          />
        )}
        {editor.record?.ninoId && (
          <PadresGuarderia
            key={editor.record.ninoId}
            beneficiariaId={beneficiariaId}
            ninoId={editor.record.ninoId}
            visible={page === 3}
            editable={
              (caps.crearFicha || caps.editarFicha) &&
              !editor.dirty &&
              !editor.busy &&
              !editor.conflict &&
              !editor.uncertain
            }
            onDirty={setPadresDirty}
          />
        )}
        {page === 3 && !editor.record && (
          <p>
            Guarda primero el borrador de Guardería para registrar los datos del
            padre.
          </p>
        )}
        {page === guarderiaSections.length - 1 &&
          editor.record &&
          editor.draft &&
          caps.confirmarFicha && (
            <section className="card">
              <h2>Revisar y confirmar</h2>
              <label className="check">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(event) => setReviewed(event.target.checked)}
                />
                He revisado la información y deseo confirmar esta ficha.
              </label>
              <button
                disabled={
                  editor.auxiliaryDirty ||
                  !reviewed ||
                  editor.dirty ||
                  editor.busy ||
                  editor.conflict ||
                  editor.uncertain
                }
                onClick={() => void editor.submit(true)}
              >
                Confirmar ficha
              </button>
            </section>
          )}
        <div className="actions">
          <button
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </button>
          {page < guarderiaSections.length - 1 && (
            <button onClick={() => setPage((current) => current + 1)}>
              Siguiente página
            </button>
          )}
        </div>
      </MarcoFicha>
      <Link to={`/beneficiarias/${beneficiariaId}/guarderia`}>
        Volver al listado
      </Link>
    </>
  );
}
