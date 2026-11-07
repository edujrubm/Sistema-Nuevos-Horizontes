export interface FormValidationError {
  fieldId: string;
  label: string;
  message: string;
}

interface FormErrorSummaryProps {
  errors: FormValidationError[];
  title?: string;
}

export function FormErrorSummary({
  errors,
  title = "Revisa los campos indicados",
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <section
      className="alert error form-error-summary"
      role="alert"
      aria-labelledby="form-error-title"
    >
      <strong id="form-error-title">{title}</strong>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a href={`#${error.fieldId}`}>
              {error.label}: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
