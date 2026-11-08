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
  { id: "family", label: "Identificación y familia" },
  { id: "background", label: "Referencia y antecedentes" },
  { id: "development", label: "Desarrollo" },
  { id: "personality", label: "Personalidad" },
  { id: "evaluation", label: "Evaluación" },
  { id: "plan", label: "Plan" },
] as const;

function textValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "string" ? value : "";
}

function numberValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "number" ? String(value) : "";
}

function booleanValue(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "boolean" ? String(value) : "";
}

export function PsychologyChildVariant({
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
  const mentalExam = value.mentalExam ?? {};

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

  function updateBoolean(field: string, rawValue: string) {
    updateDetail(field, rawValue === "" ? null : rawValue === "true");
  }

  function updateMentalExam(field: string, fieldValue: string) {
    onChange({
      ...value,
      mentalExam: { ...mentalExam, [field]: fieldValue },
    });
  }

  function moveTo(stepId: string) {
    const index = steps.findIndex((step) => step.id === stepId);
    if (index >= 0) setCurrentIndex(index);
  }

  function booleanField(field: string, label: string) {
    return (
      <SelectField
        id={`detail.${field}`}
        label={label}
        value={booleanValue(value.detail, field)}
        error={errorFor(`detalle.${field}`)}
        onChange={(event) => updateBoolean(field, event.target.value)}
      >
        <option value="">No registrado</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </SelectField>
    );
  }

  return (
    <div className="clinical-variant-layout">
      <div>
        <FormStepNavigation steps={navigationSteps} onStepChange={moveTo} />

        {currentStep.id === "family" ? (
          <FormSection
            title="Identificación y familia"
            description="Referencia y contexto familiar de la niña o niño vinculado."
            badge="Página 1"
            disabled={readOnly}
          >
            <TextField
              id="detail.fechaReferencia"
              type="date"
              label="Fecha de referencia"
              value={textValue(value.detail, "fechaReferencia")}
              error={errorFor("detalle.fechaReferencia")}
              required
              onChange={(event) =>
                updateDetail("fechaReferencia", event.target.value)
              }
            />
            <TextField
              id="detail.referidaPor"
              label="Área, persona o institución referente"
              value={textValue(value.detail, "referidaPor")}
              error={errorFor("detalle.referidaPor")}
              onChange={(event) =>
                updateDetail("referidaPor", event.target.value)
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
              label="Lugar que ocupa entre hermanas y hermanos"
              value={numberValue(value.detail, "ordenEntreHermanos")}
              error={errorFor("detalle.ordenEntreHermanos")}
              onChange={(event) =>
                updateNumber("ordenEntreHermanos", event.target.value)
              }
            />
            {booleanField(
              "otrasPersonasCasa",
              "¿Viven otras personas en casa?",
            )}
            <TextAreaField
              id="detail.historiaFamiliar"
              label="Composición e historia familiar"
              value={textValue(value.detail, "historiaFamiliar")}
              error={errorFor("detalle.historiaFamiliar")}
              fullWidth
              onChange={(event) =>
                updateDetail("historiaFamiliar", event.target.value)
              }
            />
          </FormSection>
        ) : null}

        {currentStep.id === "background" ? (
          <FormSection
            title="Referencia y antecedentes"
            description="Motivo, historia actual y antecedentes relevantes."
            badge="Página 2"
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
              id="detail.antecedentesPersonales"
              label="Antecedentes personales"
              value={textValue(value.detail, "antecedentesPersonales")}
              error={errorFor("detalle.antecedentesPersonales")}
              onChange={(event) =>
                updateDetail("antecedentesPersonales", event.target.value)
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
              fullWidth
              onChange={(event) =>
                updateDetail("antecedentesNoPatologicos", event.target.value)
              }
            />
          </FormSection>
        ) : null}

        {currentStep.id === "development" ? (
          <>
            <FormSection
              title="Embarazo, parto y psicomotricidad"
              badge="Página 3"
              disabled={readOnly}
            >
              {booleanField("hijoDeseado", "¿Fue un embarazo deseado?")}
              <TextField
                id="detail.gestacionSemanas"
                type="number"
                min={0}
                label="Semanas de gestación"
                value={numberValue(value.detail, "gestacionSemanas")}
                error={errorFor("detalle.gestacionSemanas")}
                onChange={(event) =>
                  updateNumber("gestacionSemanas", event.target.value)
                }
              />
              <TextAreaField
                id="detail.enfermedadesMadreEmbarazo"
                label="Enfermedades durante el embarazo"
                value={textValue(value.detail, "enfermedadesMadreEmbarazo")}
                error={errorFor("detalle.enfermedadesMadreEmbarazo")}
                onChange={(event) =>
                  updateDetail("enfermedadesMadreEmbarazo", event.target.value)
                }
              />
              <TextField
                id="detail.tipoEmbarazo"
                label="Tipo de embarazo"
                value={textValue(value.detail, "tipoEmbarazo")}
                error={errorFor("detalle.tipoEmbarazo")}
                onChange={(event) =>
                  updateDetail("tipoEmbarazo", event.target.value)
                }
              />
              <TextAreaField
                id="detail.condicionesParto"
                label="Condiciones del parto"
                value={textValue(value.detail, "condicionesParto")}
                error={errorFor("detalle.condicionesParto")}
                fullWidth
                onChange={(event) =>
                  updateDetail("condicionesParto", event.target.value)
                }
              />
              {[
                ["sostuvoCabezaMeses", "Sostuvo la cabeza (meses)"],
                ["gateoMeses", "Gateó (meses)"],
                ["seSentoMeses", "Se sentó (meses)"],
                ["seParoMeses", "Se paró (meses)"],
                ["primerosPasosMeses", "Primeros pasos (meses)"],
              ].map(([field, label]) => (
                <TextField
                  key={field}
                  id={`detail.${field}`}
                  type="number"
                  min={0}
                  label={label}
                  value={numberValue(value.detail, field)}
                  error={errorFor(`detalle.${field}`)}
                  onChange={(event) => updateNumber(field, event.target.value)}
                />
              ))}
              <TextAreaField
                id="detail.movimientosGenerales"
                label="Movimientos y desarrollo general"
                value={textValue(value.detail, "movimientosGenerales")}
                error={errorFor("detalle.movimientosGenerales")}
                fullWidth
                onChange={(event) =>
                  updateDetail("movimientosGenerales", event.target.value)
                }
              />
              {booleanField(
                "colaboraActividadesDomesticas",
                "¿Colabora en actividades domésticas?",
              )}
            </FormSection>
            <FormSection
              title="Esfínteres, lenguaje y sueño"
              badge="Desarrollo"
              disabled={readOnly}
            >
              {booleanField("enuresis", "¿Presenta enuresis?")}
              <TextField
                id="detail.desdeCuandoEnuresis"
                label="Enuresis: ¿desde cuándo?"
                value={textValue(value.detail, "desdeCuandoEnuresis")}
                error={errorFor("detalle.desdeCuandoEnuresis")}
                onChange={(event) =>
                  updateDetail("desdeCuandoEnuresis", event.target.value)
                }
              />
              {booleanField("encopresis", "¿Presenta encopresis?")}
              <TextField
                id="detail.desdeCuandoEncopresis"
                label="Encopresis: ¿desde cuándo?"
                value={textValue(value.detail, "desdeCuandoEncopresis")}
                error={errorFor("detalle.desdeCuandoEncopresis")}
                onChange={(event) =>
                  updateDetail("desdeCuandoEncopresis", event.target.value)
                }
              />
              {booleanField("problemasHabla", "¿Presenta problemas del habla?")}
              <TextField
                id="detail.problemasHablaDetalle"
                label="Detalle de problemas del habla"
                value={textValue(value.detail, "problemasHablaDetalle")}
                error={errorFor("detalle.problemasHablaDetalle")}
                onChange={(event) =>
                  updateDetail("problemasHablaDetalle", event.target.value)
                }
              />
              {booleanField(
                "obedeceOrdenesSencillas",
                "¿Obedece órdenes sencillas?",
              )}
              {booleanField(
                "resistenciaDormir",
                "¿Presenta resistencia al dormir?",
              )}
              <TextField
                id="detail.horasSueno"
                type="number"
                min={0}
                max={24}
                label="Horas de sueño"
                value={numberValue(value.detail, "horasSueno")}
                error={errorFor("detalle.horasSueno")}
                onChange={(event) =>
                  updateNumber("horasSueno", event.target.value)
                }
              />
              <TextField
                id="detail.conQuienDuerme"
                label="¿Con quién duerme?"
                value={textValue(value.detail, "conQuienDuerme")}
                error={errorFor("detalle.conQuienDuerme")}
                onChange={(event) =>
                  updateDetail("conQuienDuerme", event.target.value)
                }
              />
              {booleanField("mismaCama", "¿Comparte la misma cama?")}
              {booleanField("temorOscuridad", "¿Teme a la oscuridad?")}
              <TextField
                id="detail.motivoTemorOscuridad"
                label="Motivo del temor a la oscuridad"
                value={textValue(value.detail, "motivoTemorOscuridad")}
                error={errorFor("detalle.motivoTemorOscuridad")}
                onChange={(event) =>
                  updateDetail("motivoTemorOscuridad", event.target.value)
                }
              />
              {booleanField("miedoLugar", "¿Teme ir a algún lugar?")}
              <TextField
                id="detail.miedoLugarDetalle"
                label="Lugar o situación que genera temor"
                value={textValue(value.detail, "miedoLugarDetalle")}
                error={errorFor("detalle.miedoLugarDetalle")}
                onChange={(event) =>
                  updateDetail("miedoLugarDetalle", event.target.value)
                }
              />
            </FormSection>
          </>
        ) : null}

        {currentStep.id === "personality" ? (
          <FormSection
            title="Personalidad e historia familiar"
            description="Relaciones, reacciones, juego, disciplina y acontecimientos."
            badge="Página 4"
            disabled={readOnly}
          >
            {[
              ["actitudMadre", "Actitud de la madre o responsable"],
              ["actitudPadre", "Actitud del padre"],
              ["relacionEntrePadres", "Relación entre madre y padre"],
              ["reaccionNegacion", "Reacción cuando se le niega algo"],
              ["frecuenciaBerrinches", "Frecuencia de berrinches"],
              [
                "respuestaPadresBerrinches",
                "Respuesta familiar a los berrinches",
              ],
              ["juguetesPreferidos", "Juguetes preferidos"],
              ["juegosPreferidos", "Juegos preferidos"],
              [
                "estrategiasObedienciaMadre",
                "Estrategias para lograr obediencia",
              ],
              ["castigosUtilizados", "Medidas disciplinarias utilizadas"],
              ["reaccionCastigos", "Reacción ante las medidas disciplinarias"],
              ["acontecimientosImportantes", "Acontecimientos importantes"],
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
            {booleanField(
              "gustaAbrazoPadres",
              "¿Le agrada recibir afecto de sus responsables?",
            )}
          </FormSection>
        ) : null}

        {currentStep.id === "evaluation" ? (
          <>
            <FormSection
              title="Examen mental"
              badge="Página 5"
              disabled={readOnly}
            >
              {[
                ["apariencia", "Apariencia"],
                ["actitud", "Actitud"],
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
              badge="Diagnóstico"
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
              {[
                ["ejeI", "Eje I"],
                ["ejeIi", "Eje II"],
                ["ejeIii", "Eje III"],
                ["ejeIv", "Eje IV"],
                ["ejeV", "Eje V"],
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
            title="Plan y seguimiento"
            description="Plan terapéutico y observaciones finales."
            badge="Página 6"
            disabled={readOnly}
          >
            <TextAreaField
              id="detail.planTerapeutico"
              label="Plan terapéutico"
              value={textValue(value.detail, "planTerapeutico")}
              error={errorFor("detalle.planTerapeutico")}
              required
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
          {currentIndex < steps.length - 1 ? (
            <button
              className="button primary"
              type="button"
              onClick={() =>
                setCurrentIndex((index) =>
                  Math.min(steps.length - 1, index + 1),
                )
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
