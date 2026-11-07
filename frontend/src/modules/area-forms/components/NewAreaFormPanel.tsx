import { useMemo, useState, type FormEvent } from "react";

import type { AreaFormType, CreateAreaFormInput } from "../api/area-forms-api";
import { FormSection, SelectField, TextField } from "@/shared/components/forms";

interface SubjectOption {
  id: string;
  name: string;
}

interface NewAreaFormPanelProps {
  types: AreaFormType[];
  childrenOptions?: SubjectOption[];
  professionalId?: string;
  catalogReady?: boolean;
  busy?: boolean;
  error?: string;
  onCreate: (input: CreateAreaFormInput) => void | Promise<void>;
  onCancel: () => void;
}

function todayInGuatemala() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function NewAreaFormPanel({
  types,
  childrenOptions = [],
  professionalId,
  catalogReady = true,
  busy = false,
  error,
  onCreate,
  onCancel,
}: NewAreaFormPanelProps) {
  const [type, setType] = useState("");
  const [attentionDate, setAttentionDate] = useState(todayInGuatemala);
  const [childId, setChildId] = useState("");
  const [validationError, setValidationError] = useState<string>();
  const selectedType = useMemo(
    () => types.find((item) => item.codigo === type),
    [type, types],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!type || !attentionDate) {
      setValidationError("Selecciona el tipo y la fecha de atención.");
      return;
    }
    if (selectedType?.requiereNino && !childId) {
      setValidationError("Selecciona la hija o hijo correspondiente.");
      return;
    }
    if (!professionalId) {
      setValidationError(
        "No existe un profesional autorizado en la sesión actual.",
      );
      return;
    }

    setValidationError(undefined);
    void onCreate({
      tipo: type,
      fechaAtencion: attentionDate,
      profesionalId: professionalId,
      detalle: {},
      ...(selectedType?.requiereNino ? { ninoId: childId } : {}),
    });
  }

  return (
    <form onSubmit={submit}>
      {!catalogReady ? (
        <div className="alert warning" role="alert">
          <strong>El catálogo de estados no está listo.</strong>
          <span>
            No se pueden crear formularios hasta configurar los estados de
            borrador y confirmado.
          </span>
        </div>
      ) : null}
      {!professionalId ? (
        <div className="alert warning" role="alert">
          <strong>Falta el contexto profesional.</strong>
          <span>
            La sesión autenticada debe proporcionar el profesional responsable
            antes de crear la ficha.
          </span>
        </div>
      ) : null}
      {error || validationError ? (
        <div className="alert error" role="alert">
          <strong>{error ?? validationError}</strong>
        </div>
      ) : null}

      <FormSection
        title="Nueva ficha del área"
        description="Selecciona la variante y el sujeto antes de iniciar el borrador."
        badge="Nuevo borrador"
      >
        <SelectField
          id="new-area-form-type"
          label="Tipo de ficha"
          value={type}
          required
          onChange={(event) => {
            setType(event.target.value);
            setChildId("");
            setValidationError(undefined);
          }}
        >
          <option value="">Seleccionar</option>
          {types.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.descripcion}
            </option>
          ))}
        </SelectField>
        <TextField
          id="new-area-form-date"
          type="date"
          label="Fecha de atención"
          value={attentionDate}
          required
          onChange={(event) => setAttentionDate(event.target.value)}
        />
        {selectedType?.requiereNino ? (
          <SelectField
            id="new-area-form-child"
            label="Niña o niño vinculado"
            value={childId}
            required
            fullWidth
            onChange={(event) => setChildId(event.target.value)}
          >
            <option value="">Seleccionar</option>
            {childrenOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </SelectField>
        ) : null}
      </FormSection>

      <div className="area-form-actions">
        <span>La ficha se creará inicialmente como borrador.</span>
        <div>
          <button
            className="button text"
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={busy || !catalogReady || !professionalId}
          >
            {busy ? "Creando…" : "Crear borrador"}
          </button>
        </div>
      </div>
    </form>
  );
}
