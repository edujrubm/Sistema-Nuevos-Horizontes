import { RecordEditorShell } from "@/modules/area-forms/components/RecordEditorShell";
import { ApiError } from "@/shared/api/api-error";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { FormErrorSummary } from "@/shared/components/forms";
import { useCapacidades } from "@/app/capacidades";
import { useBeneficiaria } from "@/shared/context/area-record-context";
import { Cargando, ErrorVista, fecha } from "@/shared/components/feedback";
import { MarcoFicha } from "@/modules/area-forms/components";
import { legal, legalSections, referencia } from "../config/legal-form";
import { useLegalEditor } from "../hooks/useLegalEditor";

export function LegalEditorPage({
  reference = false,
}: {
  reference?: boolean;
}) {
  const { beneficiariaId = "", fichaId = "" } = useParams();
  const editor = useLegalEditor(beneficiariaId, fichaId, reference);
  const person = useBeneficiaria();
  const capabilities = useCapacidades();
  const [page, setPage] = useState(0);
  const canCreate = reference
    ? capabilities.crearReferencia
    : capabilities.crearFicha;
  const canEdit = editor.draft
    ? reference
      ? capabilities.crearReferencia
      : editor.record
        ? capabilities.editarFicha
        : canCreate
    : reference &&
      editor.confirmed &&
      capabilities.corregirReferencia &&
      editor.correction;
  const canConfirm = reference
    ? capabilities.crearReferencia
    : capabilities.confirmarFicha;
  const editable =
    canEdit && !editor.busy && !editor.conflict && !editor.uncertain;
  const labels = reference ? referencia : legal;
  const fields = reference ? Object.keys(labels) : legalSections[page].campos;
  const erroresRecibidos =
    editor.error instanceof ApiError ? editor.error.body.errores : [];
  const mensajesPorCampo = new Map<string, string[]>();
  for (const error of erroresRecibidos) {
    mensajesPorCampo.set(error.campo, [
      ...(mensajesPorCampo.get(error.campo) ?? []),
      error.mensaje,
    ]);
  }
  const detallesError = [...mensajesPorCampo].map(([campo, mensajes]) => ({
    campo,
    mensaje: mensajes.join(" "),
  }));
  const nombresCampos: Record<string, string> = {
    fechaAtencion: "Fecha de atención",
    profesionalId: "Identificador del profesional",
    motivo: "Motivo de la corrección",
    ...Object.fromEntries(
      Object.entries(labels).map(([campo, nombre]) => [
        `detalle.${campo}`,
        nombre,
      ]),
    ),
  };
  const idCampo = (campo: string) => `legal-${campo.replaceAll(".", "-")}`;
  const errorCampo = (campo: string) =>
    detallesError
      .filter((error) => error.campo === campo)
      .map((error) => error.mensaje)
      .join(" ");
  const accesibilidadCampo = (campo: string) => ({
    id: idCampo(campo),
    "aria-label": nombresCampos[campo],
    "aria-invalid": Boolean(errorCampo(campo)) || undefined,
    "aria-describedby": errorCampo(campo)
      ? `${idCampo(campo)}-error`
      : undefined,
  });
  const mensajeCampo = (campo: string) =>
    errorCampo(campo) ? (
      <span id={`${idCampo(campo)}-error`} className="field-error">
        {errorCampo(campo)}
      </span>
    ) : null;
  function mostrarCampo(fieldId: string) {
    if (!reference) {
      const seccion = legalSections.findIndex((section) =>
        section.campos.some((campo) => idCampo(`detalle.${campo}`) === fieldId),
      );
      if (seccion >= 0) setPage(seccion);
    }
    // Espera al montaje de la sección elegida antes de enfocar el campo.
    requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
  }
  const short = new Set([
    "demandadoNombreDeclarado",
    "relacionPartes",
    "numeroJuicio",
    "tipoJuicio",
    "estadoProceso",
    "juzgado",
    "juezOficial",
    "destino",
    "origen",
    "medioEntrega",
  ]);
  const completeReference =
    !reference ||
    Boolean(
      String(editor.detail.destino ?? "").trim() &&
      String(editor.detail.motivoReferencia ?? "").trim(),
    );
  if (editor.cargando) return <Cargando />;
  if (editor.error && !editor.record && fichaId)
    return <ErrorVista error={editor.error} reintentar={editor.reload} />;
  const content = (
    <>
      <form
        id="legal-record-form"
        className={reference ? "card" : "ficha-form"}
        onSubmit={(event) => {
          event.preventDefault();
          if (editable) {
            void editor.submit();
          }
        }}
      >
        <fieldset disabled={!editable}>
          <legend>
            {reference ? "Datos de la referencia" : legalSections[page].titulo}
          </legend>
          {!reference && (
            <p className="count">
              Página {page + 1} de {legalSections.length}
            </p>
          )}
          {editor.record ? (
            <div className="grid card registro">
              <label>
                Fecha de atención
                <span className="readonly">
                  {fecha(editor.record.fechaAtencion)}
                </span>
              </label>
              <label>
                Profesional responsable
                <span className="readonly">{editor.record.profesionalId}</span>
              </label>
            </div>
          ) : (
            <div className="grid">
              <label>
                Fecha de atención
                <input
                  required
                  type="datetime-local"
                  {...accesibilidadCampo("fechaAtencion")}
                  value={editor.attention}
                  onChange={(e) => editor.setAttention(e.target.value)}
                />
                {mensajeCampo("fechaAtencion")}
              </label>
              <label>
                Identificador del profesional
                <input
                  required
                  pattern="[0-9]+"
                  {...accesibilidadCampo("profesionalId")}
                  value={editor.professional}
                  onChange={(e) => editor.setProfessional(e.target.value)}
                />
                {mensajeCampo("profesionalId")}
              </label>
            </div>
          )}
          <div className={reference ? "grid" : "grid card"}>
            {!reference && (
              <h3 className="full">{legalSections[page].tarjeta}</h3>
            )}
            {page === 0 && (
              <label>
                {reference ? "Nombre de la referida" : "Actora"}
                <span className="readonly">
                  {person?.nombre ?? "Consultar expediente"}
                </span>
              </label>
            )}
            {reference && (
              <label>
                DPI/CUI
                <span className="readonly">
                  {person?.cuiEnmascarado ?? "Sin registrar"}
                </span>
              </label>
            )}
            {reference && (
              <label>
                Edad a la fecha de atención
                <span className="readonly">
                  {editor.record?.identidadAlAtender?.edad_a_la_atencion ??
                    "Sin registrar"}
                </span>
              </label>
            )}
            {fields.map((field) => (
              <label
                key={field}
                className={short.has(field) ? undefined : "full"}
              >
                {labels[field]}
                {editable ? (
                  field.endsWith("Fecha") ? (
                    <input
                      type="date"
                      {...accesibilidadCampo(`detalle.${field}`)}
                      value={String(editor.detail[field] ?? "")}
                      onChange={(e) => editor.change(field, e.target.value)}
                    />
                  ) : short.has(field) ? (
                    <input
                      maxLength={20000}
                      {...accesibilidadCampo(`detalle.${field}`)}
                      value={String(editor.detail[field] ?? "")}
                      onChange={(e) => editor.change(field, e.target.value)}
                    />
                  ) : (
                    <textarea
                      maxLength={20000}
                      rows={field === "diligenciamiento" ? 6 : 3}
                      {...accesibilidadCampo(`detalle.${field}`)}
                      value={String(editor.detail[field] ?? "")}
                      onChange={(e) => editor.change(field, e.target.value)}
                    />
                  )
                ) : (
                  <span className="readonly">
                    {String(editor.detail[field] ?? "Sin registrar")}
                  </span>
                )}
                {mensajeCampo(`detalle.${field}`)}
              </label>
            ))}
          </div>
          {editor.correction && (
            <label>
              Motivo de la corrección
              <input
                required
                maxLength={2000}
                {...accesibilidadCampo("motivo")}
                value={editor.reason}
                onChange={(e) => editor.setReason(e.target.value)}
              />
              {mensajeCampo("motivo")}
            </label>
          )}
        </fieldset>
      </form>

      {reference && (
        <p>
          La firma se incorpora al documento impreso conforme al procedimiento
          institucional.
        </p>
      )}
    </>
  );
  return (
    <RecordEditorShell
      editor={editor}
      title={reference ? "Hoja de referencia" : "Ficha Legal"}
      area="Área Legal"
      type={reference ? "REFERENCIA_LEGAL" : "LEGAL"}
      subject={person?.nombre}
      back={`/beneficiarias/${beneficiariaId}/${reference ? "referencias" : "legal"}`}
      editable={editable}
      canSave={canEdit}
      canConfirm={canConfirm && completeReference}
      correction={editor.correction}
      saveDisabled={editor.correction && !editor.reason.trim()}
    >
      <FormErrorSummary
        errors={detallesError.map((error) => ({
          fieldId: idCampo(error.campo),
          label: nombresCampos[error.campo] ?? "Datos del formulario",
          message: error.mensaje,
        }))}
        requestId={
          editor.error instanceof ApiError
            ? editor.error.body.idSolicitud
            : undefined
        }
        onFieldClick={mostrarCampo}
      />
      <ErrorVista
        error={detallesError.length ? undefined : editor.error}
        reintentar={editor.record ? editor.reload : undefined}
      />
      {reference &&
        editor.confirmed &&
        capabilities.corregirReferencia &&
        !editor.correction && (
          <button onClick={() => editor.setCorrection(true)}>
            Iniciar corrección
          </button>
        )}
      {reference ? (
        content
      ) : (
        <MarcoFicha paginas={legalSections} pagina={page} cambiar={setPage}>
          {content}
          <div className="actions">
            <button
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>
            {page < legalSections.length - 1 && (
              <button onClick={() => setPage((current) => current + 1)}>
                Siguiente página
              </button>
            )}
          </div>
        </MarcoFicha>
      )}
    </RecordEditorShell>
  );
}
