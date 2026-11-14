import { ApiError } from "@/shared/api/api-error";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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
import { socialFields, socialSections } from "../social-form.config";
import { useSocialEditor } from "../hooks/useSocialEditor";

const shortFields = new Set([
  "tipoVivienda",
  "dependenciaEconomica",
  "responsablePlan",
  "areaCoordinacionId",
  "fechaRevision",
  "fechaCierre",
]);
const fieldId = (field: string) => `social-${field.replaceAll(".", "-")}`;

export function SocialEditorPage() {
  const { beneficiariaId = "", fichaId = "" } = useParams();
  const editor = useSocialEditor(beneficiariaId, fichaId);
  const person = useBeneficiaria();
  const { setArea } = useAreaFicha();
  useEffect(() => {
    setArea("Trabajo Social");
    return () => setArea("");
  }, [setArea]);
  const caps = useCapacidades();
  const [page, setPage] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const canEdit =
    editor.draft && (editor.record ? caps.editarFicha : caps.crearFicha);
  const editable =
    canEdit && !editor.busy && !editor.conflict && !editor.uncertain;
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
      Object.entries(socialFields).map(([key, label]) => [
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
    const section = socialSections.findIndex((section) =>
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
          <p className="eyebrow">Trabajo Social</p>
          <h1>Ficha social</h1>
        </div>
        <span className="badge">
          {estadoTexto(editor.record?.estadoCodigo ?? editor.record?.estado)}
        </span>
      </header>
      <BarraBeneficiaria />
      <PestañasArea beneficiariaId={beneficiariaId} area="SOCIAL" />
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
            to={`/beneficiarias/${beneficiariaId}/documentos?tipo=SOCIAL&formularioId=${editor.record!.id}`}
          >
            Adjuntar PDF firmado
          </Link>
        </div>
      )}
      <MarcoFicha paginas={socialSections} pagina={page} cambiar={setPage}>
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
          <fieldset disabled={!editable}>
            <legend>{socialSections[page].titulo}</legend>
            <p className="count">
              Página {page + 1} de {socialSections.length}
            </p>
            {page === 0 && (
              <div className="grid card registro">
                <label>
                  Nombre
                  <span className="readonly">
                    {person?.nombre ?? "Consultar expediente"}
                  </span>
                </label>
                <label>
                  DPI/CUI
                  <span className="readonly">
                    {person?.cuiEnmascarado ?? "Protegido o sin registrar"}
                  </span>
                </label>
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
            <div className="grid card">
              <h3 className="full">{socialSections[page].tarjeta}</h3>
              {socialSections[page].campos.map((field) => (
                <label
                  key={field}
                  className={shortFields.has(field) ? undefined : "full"}
                >
                  {socialFields[field]}
                  {!editable ? (
                    <span className="readonly">
                      {editor.detail[field] === true
                        ? "Sí"
                        : editor.detail[field] === false
                          ? "No"
                          : String(editor.detail[field] ?? "Sin registrar")}
                    </span>
                  ) : field === "dependenciaEconomica" ||
                    field === "tipoVivienda" ? (
                    <select
                      {...accessibility(`detalle.${field}`)}
                      value={String(editor.detail[field] ?? "")}
                      onChange={(event) => change(field, event.target.value)}
                    >
                      <option value="">Sin registrar</option>
                      {(field === "tipoVivienda"
                        ? ["Alquilada", "Propia", "Prestada", "Temporal"]
                        : ["true", "false"]
                      ).map((value) => (
                        <option key={value} value={value}>
                          {value === "true"
                            ? "Sí"
                            : value === "false"
                              ? "No"
                              : value}
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
          </fieldset>
          {canEdit && (
            <div className="actions">
              <button className="primary" type="submit" disabled={!editable}>
                Guardar borrador
              </button>
            </div>
          )}
        </form>
        {page === socialSections.length - 1 &&
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
          {page < socialSections.length - 1 && (
            <button onClick={() => setPage((current) => current + 1)}>
              Siguiente página
            </button>
          )}
        </div>
      </MarcoFicha>
      <Link to={`/beneficiarias/${beneficiariaId}/social`}>
        Volver al listado
      </Link>
    </>
  );
}
