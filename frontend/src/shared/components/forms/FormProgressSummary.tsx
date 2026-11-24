import type { FormStep } from "./FormStepNavigation";

interface FormProgressSummaryProps {
  steps: FormStep[];
  title?: string;
}

const statusLabels = {
  pending: "Pendiente",
  current: "Actual",
  complete: "Revisada",
  error: "Con errores",
} as const;

export function FormProgressSummary({
  steps,
  title = "Progreso de la ficha",
}: FormProgressSummaryProps) {
  const completed = steps.filter((step) => step.status === "complete").length;
  const currentIndex = steps.findIndex((step) => step.status === "current");
  const reached = currentIndex >= 0 ? currentIndex + 1 : completed;
  const percentage =
    steps.length === 0 ? 0 : Math.round((reached / steps.length) * 100);

  return (
    <aside
      className="panel form-progress"
      aria-labelledby="form-progress-title"
    >
      <h2 id="form-progress-title">{title}</h2>
      <progress max={100} value={percentage}>
        {percentage}%
      </progress>
      <div className="form-progress-copy">
        <span>
          {steps.length
            ? `Paso ${Math.max(reached, 1)} de ${steps.length}`
            : "Sin pasos"}
        </span>
        <strong>{percentage}%</strong>
      </div>
      <ol>
        {steps.map((step) => (
          <li key={step.id} className={step.status}>
            <span className="progress-dot" aria-hidden="true" />
            <span>{step.label}</span>
            <strong>{statusLabels[step.status]}</strong>
          </li>
        ))}
      </ol>
    </aside>
  );
}
