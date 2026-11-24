import { useMemo, useState } from "react";

import type { FormVariantComponentProps } from "@/modules/area-forms/variants";
import {
  FormProgressSummary,
  FormSection,
  FormStepNavigation,
  SelectField,
  TextAreaField,
  TextField,
  type FormStep,
} from "@/shared/components/forms";

const steps = [
  { id: "identification", label: "Identificación" },
  { id: "history", label: "Motivo y HEA" },
  { id: "background", label: "Antecedentes" },
  { id: "exam", label: "Examen" },
  { id: "plan", label: "Plan y cierre" },
] as const;

type MedicineVariantKind = "woman" | "adolescent" | "child";

function textValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "string" ? value : "";
}

function numberValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "number" ? String(value) : "";
}

function guatemalaDateTimeValue(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function toGuatemalaIso(value: string) {
  return value ? new Date(`${value}:00-06:00`).toISOString() : null;
}

interface MedicineVariantProps extends FormVariantComponentProps {
  variant: MedicineVariantKind;
  motherName?: string;
}

export function MedicineVariant({
  variant,
  motherName,
  value,
  errors,
  readOnly,
  onChange,
}: MedicineVariantProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [otherResponsibleSelected, setOtherResponsibleSelected] =
    useState(false);
  const currentStep = steps[currentIndex];
  const navigationSteps = useMemo<FormStep[]>(
    () =>
      steps.map((step, index) => ({
        ...step,
        status:
          index === currentIndex
            ? "current"
            : index < currentIndex
              ? "complete"
              : "pending",
      })),
    [currentIndex],
  );

  function errorFor(field: string) {
    return errors.find((error) => error.field === field)?.message;
  }

  function updateDetail(field: string, fieldValue: unknown) {
    onChange({
      ...value,
      detail: { ...value.detail, [field]: fieldValue },
    });
  }

  function updateNumber(field: string, rawValue: string) {
    updateDetail(field, rawValue === "" ? null : Number(rawValue));
  }

  function moveTo(stepId: string) {
    const index = steps.findIndex((step) => step.id === stepId);
    if (index >= 0) setCurrentIndex(index);
  }

  const responsibleName = textValue(
    value.detail,
    "nombreResponsableDeclarado",
  );
  const motherSelected = Boolean(
    variant === "child" &&
    motherName &&
    responsibleName.trim() === motherName.trim(),
  );
  const responsibleSelection = motherSelected
    ? "mother"
    : responsibleName || otherResponsibleSelected
      ? "other"
      : "";

  return (
    <div className="clinical-variant-layout">
      <div>
        <FormStepNavigation steps={navigationSteps} onStepChange={moveTo} />

        {currentStep.id === "identification" ? (
          <FormSection
            title="Identificación de la atención"
            description={
              variant === "child"
                ? "La niña o niño, la variante y la fecha provienen de la cabecera de esta ficha."
                : "La beneficiaria, la variante y la fecha provienen de la cabecera de esta ficha."
            }
            badge="Sección 1"
            disabled={readOnly}
          >
            {variant === "child" && motherName ? (
              <>
                <SelectField
                  id="detail.responsibleSelection"
                  label="Persona responsable"
                  value={responsibleSelection}
                  fullWidth
                  onChange={(event) => {
                    const selection = event.target.value;
                    setOtherResponsibleSelected(selection === "other");
                    updateDetail(
                      "nombreResponsableDeclarado",
                      selection === "mother" ? motherName : "",
                    );
                  }}
                >
                  <option value="">Seleccionar</option>
                  <option value="mother">
                    Beneficiaria madre: {motherName}
                  </option>
                  <option value="other">Otra persona</option>
                </SelectField>
                {responsibleSelection === "other" ? (
                  <TextField
                    id="detail.nombreResponsableDeclarado"
                    label="Nombre de la persona responsable"
                    value={responsibleName}
                    error={errorFor("detalle.nombreResponsableDeclarado")}
                    fullWidth
                    onChange={(event) =>
                      updateDetail(
                        "nombreResponsableDeclarado",
                        event.target.value,
                      )
                    }
                  />
                ) : null}
              </>
            ) : variant !== "woman" ? (
              <TextField
                id="detail.nombreResponsableDeclarado"
                label="Responsable, cuando corresponda"
                value={textValue(value.detail, "nombreResponsableDeclarado")}
                error={errorFor("detalle.nombreResponsableDeclarado")}
                fullWidth
                onChange={(event) =>
                  updateDetail("nombreResponsableDeclarado", event.target.value)
                }
              />
            ) : (
              <p className="field-hint full">
                La identidad de la beneficiaria se muestra desde el expediente
                y no se duplica como dato editable.
              </p>
            )}
          </FormSection>
        ) : null}

        {currentStep.id === "history" ? (
          <FormSection
            title="Motivo e historia de la enfermedad actual"
            badge="Sección 2"
            disabled={readOnly}
          >
            <TextAreaField
              id="detail.motivoConsulta"
              label="Motivo de consulta"
              value={textValue(value.detail, "motivoConsulta")}
              error={errorFor("detalle.motivoConsulta")}
              required
              fullWidth
              onChange={(event) =>
                updateDetail("motivoConsulta", event.target.value)
              }
            />
            <TextAreaField
              id="detail.historiaEnfermedadActual"
              label="Historia de la enfermedad actual (HEA)"
              value={textValue(value.detail, "historiaEnfermedadActual")}
              error={errorFor("detalle.historiaEnfermedadActual")}
              fullWidth
              onChange={(event) =>
                updateDetail("historiaEnfermedadActual", event.target.value)
              }
            />
          </FormSection>
        ) : null}

        {currentStep.id === "background" ? (
          <FormSection
            title="Antecedentes"
            description={
              variant === "child"
                ? "Vacunación, nacimiento y antecedentes de la niña o niño."
                : variant === "adolescent"
                  ? "Antecedentes correspondientes a la variante de mujer adolescente."
                  : "Antecedentes correspondientes a la variante de mujer."
            }
            badge="Sección 3"
            disabled={readOnly}
          >
            {variant !== "woman" ? (
              <>
                <TextAreaField
                  id="detail.esquemaVacunacion"
                  label="Esquema de vacunación"
                  value={textValue(value.detail, "esquemaVacunacion")}
                  error={errorFor("detalle.esquemaVacunacion")}
                  onChange={(event) =>
                    updateDetail("esquemaVacunacion", event.target.value)
                  }
                />
                <TextAreaField
                  id="detail.condicionesNacer"
                  label="Condiciones al nacer"
                  value={textValue(value.detail, "condicionesNacer")}
                  error={errorFor("detalle.condicionesNacer")}
                  onChange={(event) =>
                    updateDetail("condicionesNacer", event.target.value)
                  }
                />
                <TextAreaField
                  id="detail.antecedentesPatologicos"
                  label="Antecedentes patológicos"
                  value={textValue(value.detail, "antecedentesPatologicos")}
                  error={errorFor("detalle.antecedentesPatologicos")}
                  fullWidth
                  onChange={(event) =>
                    updateDetail("antecedentesPatologicos", event.target.value)
                  }
                />
              </>
            ) : (
              <TextAreaField
                id="detail.antecedentesImportancia"
                label="Antecedentes de importancia"
                value={textValue(value.detail, "antecedentesImportancia")}
                error={errorFor("detalle.antecedentesImportancia")}
                fullWidth
                onChange={(event) =>
                  updateDetail("antecedentesImportancia", event.target.value)
                }
              />
            )}
            {variant !== "child" ? (
              <TextAreaField
                id="detail.antecedentesGinecologicos"
                label="Antecedentes ginecológicos"
                value={textValue(value.detail, "antecedentesGinecologicos")}
                error={errorFor("detalle.antecedentesGinecologicos")}
                fullWidth
                onChange={(event) =>
                  updateDetail("antecedentesGinecologicos", event.target.value)
                }
              />
            ) : null}
          </FormSection>
        ) : null}

        {currentStep.id === "exam" ? (
          <>
            <FormSection
              title="Signos y medidas"
              description="Registra los valores observados; la interfaz no calcula diagnósticos."
              badge="Sección 4"
              disabled={readOnly}
            >
              {[
                ["frecuenciaCardiacaLpm", "Frecuencia cardíaca (lpm)"],
                ["frecuenciaRespiratoriaRpm", "Frecuencia respiratoria (rpm)"],
                ["temperaturaC", "Temperatura (°C)"],
                ["tallaCm", "Talla (cm)"],
                ["pesoKg", "Peso (kg)"],
                ["presionSistolicaMmhg", "Presión sistólica (mmHg)"],
                ["presionDiastolicaMmhg", "Presión diastólica (mmHg)"],
              ].map(([field, label]) => (
                <TextField
                  key={field}
                  id={`detail.${field}`}
                  type="number"
                  step="any"
                  label={label}
                  value={numberValue(value.detail, field)}
                  error={errorFor(`detalle.${field}`)}
                  onChange={(event) => updateNumber(field, event.target.value)}
                />
              ))}
            </FormSection>
            <FormSection
              title="Examen físico"
              badge="Sección 5"
              disabled={readOnly}
            >
              {[
                ["examenFisicoGeneral", "Examen físico general"],
                ["cabeza", "Cabeza"],
                ["torax", "Tórax"],
                ["abdomen", "Abdomen"],
                ["genitales", "Genitales"],
                ...(variant === "woman"
                  ? [["ginecologico", "Examen ginecológico"]]
                  : []),
                ["extremidades", "Extremidades"],
              ].map(([field, label]) => (
                <TextAreaField
                  key={field}
                  id={`detail.${field}`}
                  label={label}
                  value={textValue(value.detail, field)}
                  error={errorFor(`detalle.${field}`)}
                  onChange={(event) => updateDetail(field, event.target.value)}
                />
              ))}
            </FormSection>
          </>
        ) : null}

        {currentStep.id === "plan" ? (
          <FormSection
            title="Plan y cierre"
            description="Impresión clínica, tratamiento y seguimiento de la atención."
            badge="Sección 6"
            disabled={readOnly}
          >
            {[
              ["impresionClinica", "Impresión clínica"],
              ["tratamiento", "Tratamiento"],
              ["laboratoriosExamenes", "Laboratorios o exámenes"],
              ["referencia", "Referencia"],
            ].map(([field, label]) => (
              <TextAreaField
                key={field}
                id={`detail.${field}`}
                label={label}
                value={textValue(value.detail, field)}
                error={errorFor(`detalle.${field}`)}
                fullWidth
                onChange={(event) => updateDetail(field, event.target.value)}
              />
            ))}
            <TextField
              id="detail.proximaCita"
              type="datetime-local"
              label="Próxima cita"
              value={guatemalaDateTimeValue(value.detail.proximaCita)}
              error={errorFor("detalle.proximaCita")}
              onChange={(event) =>
                updateDetail("proximaCita", toGuatemalaIso(event.target.value))
              }
            />
            <TextAreaField
              id="detail.proximaCitaIndicaciones"
              label="Indicaciones para la próxima cita"
              value={textValue(value.detail, "proximaCitaIndicaciones")}
              error={errorFor("detalle.proximaCitaIndicaciones")}
              onChange={(event) =>
                updateDetail("proximaCitaIndicaciones", event.target.value)
              }
            />
          </FormSection>
        ) : null}

        <div className="clinical-step-actions">
          <button
            className="button secondary"
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          >
            Anterior
          </button>
          {currentIndex < steps.length - 1 ? (
            <button
              className="button primary"
              type="button"
              onClick={() =>
                setCurrentIndex((index) => Math.min(steps.length - 1, index + 1))
              }
            >
              Siguiente página
            </button>
          ) : null}
        </div>
      </div>
      <FormProgressSummary steps={navigationSteps} />
    </div>
  );
}

export function MedicineWomanVariant(props: FormVariantComponentProps) {
  return <MedicineVariant {...props} variant="woman" />;
}

export function MedicineAdolescentVariant(props: FormVariantComponentProps) {
  return <MedicineVariant {...props} variant="adolescent" />;
}

export function MedicineChildVariant(props: FormVariantComponentProps) {
  return <MedicineVariant {...props} variant="child" />;
}

export interface MedicineChildVariantWithMotherProps
  extends FormVariantComponentProps {
  motherName?: string;
}

export function MedicineChildVariantWithMother({
  motherName,
  ...props
}: MedicineChildVariantWithMotherProps) {
  return <MedicineVariant {...props} variant="child" motherName={motherName} />;
}
