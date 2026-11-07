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
  { id: "history", label: "Motivo e historia" },
  { id: "evaluation", label: "Examen y evaluación" },
  { id: "plan", label: "Plan y cierre" },
] as const;

function textValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "string" ? value : "";
}

function numberValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "number" ? String(value) : "";
}

export function PsychologyWomanVariant({
  value,
  errors,
  readOnly,
  onChange,
}: FormVariantComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  function errorFor(path: string) {
    return errors.find((error) => error.field === path)?.message;
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

  function updateMentalExam(field: string, fieldValue: string) {
    onChange({
      ...value,
      mentalExam: { ...(value.mentalExam ?? {}), [field]: fieldValue },
    });
  }

  function moveTo(stepId: string) {
    const index = steps.findIndex((step) => step.id === stepId);
    if (index >= 0) setCurrentIndex(index);
  }

  const mentalExam = value.mentalExam ?? {};

  return (
    <div className="clinical-variant-layout">
      <div>
        <FormStepNavigation steps={navigationSteps} onStepChange={moveTo} />

        {currentStep.id === "identification" ? (
          <FormSection
            title="Identificación y referencia"
            description="Datos de procedencia de la atención psicológica."
            badge="Sección 1"
            disabled={readOnly}
          >
            <TextField
              id="detail.fechaReferencia"
              type="date"
              label="Fecha de referencia"
              value={textValue(value.detail, "fechaReferencia")}
              error={errorFor("detalle.fechaReferencia")}
              onChange={(event) =>
                updateDetail("fechaReferencia", event.target.value)
              }
            />
            <TextField
              id="detail.referidaPor"
              label="Persona o institución referente"
              value={textValue(value.detail, "referidaPor")}
              error={errorFor("detalle.referidaPor")}
              onChange={(event) =>
                updateDetail("referidaPor", event.target.value)
              }
            />
          </FormSection>
        ) : null}

        {currentStep.id === "history" ? (
          <>
            <FormSection
              title="Motivo e historia del problema"
              description="Información clínica y antecedentes relevantes."
              badge="Sección 2"
              disabled={readOnly}
            >
              <TextAreaField
                id="detail.motivoConsulta"
                label="Motivo de consulta"
                value={textValue(value.detail, "motivoConsulta")}
                error={errorFor("detalle.motivoConsulta")}
                fullWidth
                onChange={(event) =>
                  updateDetail("motivoConsulta", event.target.value)
                }
              />
              <TextAreaField
                id="detail.historiaProblemaActual"
                label="Historia del problema actual"
                value={textValue(value.detail, "historiaProblemaActual")}
                error={errorFor("detalle.historiaProblemaActual")}
                fullWidth
                onChange={(event) =>
                  updateDetail("historiaProblemaActual", event.target.value)
                }
              />
              <TextAreaField
                id="detail.antecedentesPatologicos"
                label="Antecedentes patológicos"
                value={textValue(value.detail, "antecedentesPatologicos")}
                error={errorFor("detalle.antecedentesPatologicos")}
                onChange={(event) =>
                  updateDetail("antecedentesPatologicos", event.target.value)
                }
              />
              <TextAreaField
                id="detail.antecedentesNoPatologicos"
                label="Antecedentes no patológicos"
                value={textValue(value.detail, "antecedentesNoPatologicos")}
                error={errorFor("detalle.antecedentesNoPatologicos")}
                onChange={(event) =>
                  updateDetail("antecedentesNoPatologicos", event.target.value)
                }
              />
            </FormSection>
            <FormSection
              title="Historia familiar"
              badge="Sección 3"
              disabled={readOnly}
            >
              <TextAreaField
                id="detail.historiaFamiliar"
                label="Composición y dinámica familiar"
                value={textValue(value.detail, "historiaFamiliar")}
                error={errorFor("detalle.historiaFamiliar")}
                fullWidth
                onChange={(event) =>
                  updateDetail("historiaFamiliar", event.target.value)
                }
              />
              <TextField
                id="detail.numeroHermanos"
                type="number"
                min={0}
                label="Número de hermanas y hermanos"
                value={numberValue(value.detail, "numeroHermanos")}
                error={errorFor("detalle.numeroHermanos")}
                onChange={(event) =>
                  updateNumber("numeroHermanos", event.target.value)
                }
              />
              <TextField
                id="detail.ordenEntreHermanos"
                type="number"
                min={1}
                label="Orden entre hermanas y hermanos"
                value={numberValue(value.detail, "ordenEntreHermanos")}
                error={errorFor("detalle.ordenEntreHermanos")}
                onChange={(event) =>
                  updateNumber("ordenEntreHermanos", event.target.value)
                }
              />
              <TextField
                id="detail.hijosVivosReportados"
                type="number"
                min={0}
                label="Hijas e hijos vivos reportados"
                value={numberValue(value.detail, "hijosVivosReportados")}
                error={errorFor("detalle.hijosVivosReportados")}
                onChange={(event) =>
                  updateNumber("hijosVivosReportados", event.target.value)
                }
              />
              <TextField
                id="detail.hijosFallecidosReportados"
                type="number"
                min={0}
                label="Hijas e hijos fallecidos reportados"
                value={numberValue(value.detail, "hijosFallecidosReportados")}
                error={errorFor("detalle.hijosFallecidosReportados")}
                onChange={(event) =>
                  updateNumber("hijosFallecidosReportados", event.target.value)
                }
              />
            </FormSection>
          </>
        ) : null}

        {currentStep.id === "evaluation" ? (
          <>
            <FormSection
              title="Examen mental"
              badge="Sección 4"
              disabled={readOnly}
            >
              <SelectField
                id="mentalExam.apariencia"
                label="Apariencia"
                value={textValue(mentalExam, "apariencia")}
                error={errorFor("examenMental.apariencia")}
                onChange={(event) =>
                  updateMentalExam("apariencia", event.target.value)
                }
              >
                <option value="">Seleccionar</option>
                <option value="Adecuada">Adecuada</option>
                <option value="Descuidada">Descuidada</option>
                <option value="Otra">Otra</option>
              </SelectField>
              <SelectField
                id="mentalExam.actitud"
                label="Actitud"
                value={textValue(mentalExam, "actitud")}
                error={errorFor("examenMental.actitud")}
                onChange={(event) =>
                  updateMentalExam("actitud", event.target.value)
                }
              >
                <option value="">Seleccionar</option>
                <option value="Colaboradora">Colaboradora</option>
                <option value="Reservada">Reservada</option>
                <option value="Otra">Otra</option>
              </SelectField>
              {[
                ["lenguaje", "Lenguaje"],
                ["percepcion", "Percepción"],
                ["humor", "Humor"],
                ["inteligencia", "Inteligencia"],
                ["orientacionEspacial", "Orientación espacial"],
                ["orientacionTemporal", "Orientación temporal"],
                ["controlImpulsos", "Control de impulsos"],
                ["insight", "Insight"],
              ].map(([field, label]) => (
                <TextField
                  key={field}
                  id={`mentalExam.${field}`}
                  label={label}
                  value={textValue(mentalExam, field)}
                  error={errorFor(`examenMental.${field}`)}
                  onChange={(event) =>
                    updateMentalExam(field, event.target.value)
                  }
                />
              ))}
              <TextAreaField
                id="mentalExam.contenidoPensamiento"
                label="Contenido del pensamiento"
                value={textValue(mentalExam, "contenidoPensamiento")}
                error={errorFor("examenMental.contenidoPensamiento")}
                onChange={(event) =>
                  updateMentalExam("contenidoPensamiento", event.target.value)
                }
              />
              <TextAreaField
                id="mentalExam.cursoPensamiento"
                label="Curso del pensamiento"
                value={textValue(mentalExam, "cursoPensamiento")}
                error={errorFor("examenMental.cursoPensamiento")}
                onChange={(event) =>
                  updateMentalExam("cursoPensamiento", event.target.value)
                }
              />
            </FormSection>
            <FormSection
              title="Evaluación"
              badge="Sección 5"
              disabled={readOnly}
            >
              <TextAreaField
                id="detail.pruebasAuxiliares"
                label="Pruebas auxiliares"
                value={textValue(value.detail, "pruebasAuxiliares")}
                error={errorFor("detalle.pruebasAuxiliares")}
                fullWidth
                onChange={(event) =>
                  updateDetail("pruebasAuxiliares", event.target.value)
                }
              />
              <TextAreaField
                id="detail.criteriosDiagnosticos"
                label="Criterios diagnósticos"
                value={textValue(value.detail, "criteriosDiagnosticos")}
                error={errorFor("detalle.criteriosDiagnosticos")}
                fullWidth
                onChange={(event) =>
                  updateDetail("criteriosDiagnosticos", event.target.value)
                }
              />
              {["I", "Ii", "Iii", "Iv", "V"].map((axis) => {
                const field = `eje${axis}`;
                return (
                  <TextAreaField
                    key={field}
                    id={`detail.${field}`}
                    label={`Eje ${axis.toUpperCase()}`}
                    value={textValue(value.detail, field)}
                    error={errorFor(`detalle.${field}`)}
                    onChange={(event) =>
                      updateDetail(field, event.target.value)
                    }
                  />
                );
              })}
            </FormSection>
          </>
        ) : null}

        {currentStep.id === "plan" ? (
          <FormSection
            title="Plan y cierre"
            description="Plan terapéutico y observaciones finales."
            badge="Cierre"
            disabled={readOnly}
          >
            <TextAreaField
              id="detail.planTerapeutico"
              label="Plan terapéutico"
              value={textValue(value.detail, "planTerapeutico")}
              error={errorFor("detalle.planTerapeutico")}
              fullWidth
              onChange={(event) =>
                updateDetail("planTerapeutico", event.target.value)
              }
            />
            <TextAreaField
              id="detail.observaciones"
              label="Observaciones finales"
              value={textValue(value.detail, "observaciones")}
              error={errorFor("detalle.observaciones")}
              fullWidth
              onChange={(event) =>
                updateDetail("observaciones", event.target.value)
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
          <button
            className="button primary"
            type="button"
            disabled={currentIndex === steps.length - 1}
            onClick={() =>
              setCurrentIndex((index) => Math.min(steps.length - 1, index + 1))
            }
          >
            Siguiente página
          </button>
        </div>
      </div>
      <FormProgressSummary steps={navigationSteps} />
    </div>
  );
}
