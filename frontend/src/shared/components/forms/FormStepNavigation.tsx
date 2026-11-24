export type FormStepStatus = "pending" | "current" | "complete" | "error";

export interface FormStep {
  id: string;
  label: string;
  status: FormStepStatus;
  disabled?: boolean;
}

interface FormStepNavigationProps {
  steps: FormStep[];
  onStepChange: (stepId: string) => void;
  label?: string;
}

export function FormStepNavigation({
  steps,
  onStepChange,
  label = "Pasos del formulario",
}: FormStepNavigationProps) {
  return (
    <nav className="form-step-navigation" aria-label={label}>
      <ol>
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              className={`form-step ${step.status}`}
              aria-current={step.status === "current" ? "step" : undefined}
              disabled={step.disabled}
              onClick={() => onStepChange(step.id)}
            >
              <span className="form-step-number" aria-hidden="true">
                {step.status === "complete" ? "✓" : index + 1}
              </span>
              <span>{step.label}</span>
              {step.status === "error" ? (
                <span className="sr-only">, contiene errores</span>
              ) : null}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
