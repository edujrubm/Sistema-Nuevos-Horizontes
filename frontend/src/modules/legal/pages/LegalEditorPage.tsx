import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import {
  BarraBeneficiaria,
  useBeneficiaria,
} from "@/shared/context/area-record-context";
import {
  Cargando,
  ErrorVista,
  estadoTexto,
  fecha,
} from "@/shared/components/feedback";
import {
  MarcoFicha,
  PestañasArea,
} from "@/modules/area-forms/components";
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
  const [reviewed, setReviewed] = useState(false);
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
  const editable = canEdit && !editor.busy && !editor.conflict;
  const labels = reference ? referencia : legal;
  const fields = reference ? Object.keys(labels) : legalSections[page].campos;
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
        className={reference ? "card" : "ficha-form"}
        onSubmit={(event) => {
          event.preventDefault();
          if (editable) {
            setReviewed(false);
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
                  value={editor.attention}
                  onChange={(e) => editor.setAttention(e.target.value)}
                />
              </label>
              <label>
                Identificador del profesional
                <input
                  required
                  pattern="[1-9][0-9]*"
                  value={editor.professional}
                  onChange={(e) => editor.setProfessional(e.target.value)}
                />
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
                      value={String(editor.detail[field] ?? "")}
                      onChange={(e) => (
                        setReviewed(false),
                        editor.change(field, e.target.value)
                      )}
                    />
                  ) : short.has(field) ? (
                    <input
                      maxLength={20000}
                      value={String(editor.detail[field] ?? "")}
                      onChange={(e) => (
                        setReviewed(false),
                        editor.change(field, e.target.value)
                      )}
                    />
                  ) : (
                    <textarea
                      maxLength={20000}
                      rows={field === "diligenciamiento" ? 6 : 3}
                      value={String(editor.detail[field] ?? "")}
                      onChange={(e) => (
                        setReviewed(false),
                        editor.change(field, e.target.value)
                      )}
                    />
                  )
                ) : (
                  <span className="readonly">
                    {String(editor.detail[field] ?? "Sin registrar")}
                  </span>
                )}
              </label>
            ))}
          </div>
          {editor.correction && (
            <label>
              Motivo de la corrección
              <input
                required
                maxLength={2000}
                value={editor.reason}
                onChange={(e) => editor.setReason(e.target.value)}
              />
            </label>
          )}
        </fieldset>
        {canEdit && (
          <div className="actions">
            <button
              className="primary"
              type="submit"
              disabled={
                !editable ||
                (Boolean(editor.record) && !editor.dirty) ||
                (editor.correction && !editor.reason.trim())
              }
            >
              {editor.busy ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        )}
      </form>
      {editor.record &&
        editor.draft &&
        canConfirm &&
        (reference || page === legalSections.length - 1) && (
          <section className="card">
            <h2>Revisar y confirmar</h2>
            <label className="check">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              He revisado la información y deseo confirmar esta ficha.
            </label>
            <button
              disabled={
                !reviewed ||
                editor.dirty ||
                editor.busy ||
                editor.conflict ||
                !completeReference
              }
              onClick={() => void editor.submit(true)}
            >
              Confirmar ficha
            </button>
          </section>
        )}
      {reference && (
        <p>
          La firma se incorpora al documento impreso conforme al procedimiento
          institucional.
        </p>
      )}
    </>
  );
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Área Legal</p>
          <h1>{reference ? "Hoja de referencia" : "Ficha Legal"}</h1>
        </div>
        <span className="badge">
          {estadoTexto(editor.record?.estadoCodigo ?? editor.record?.estado)}
        </span>
      </header>
      <BarraBeneficiaria />
      <PestañasArea
        beneficiariaId={beneficiariaId}
        area="LEGAL"
        referencia={reference}
      />
      <ErrorVista
        error={editor.error}
        reintentar={editor.record ? editor.reload : undefined}
      />
      {editor.message && <p role="status">{editor.message}</p>}
      {!editor.draft && <p className="alert">Registro en modo de consulta.</p>}
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
      <Link
        to={`/beneficiarias/${beneficiariaId}/${reference ? "referencias" : "legal"}`}
      >
        Volver al listado
      </Link>
    </>
  );
}
