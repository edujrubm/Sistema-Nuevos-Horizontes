import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  children: ReactNode;
}

export function FormSection({
  title,
  description,
  badge,
  disabled = false,
  children,
}: FormSectionProps) {
  return (
    <fieldset className="panel form-section" disabled={disabled}>
      <legend className="sr-only">{title}</legend>
      <header className="form-section-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {badge ? <span className="form-section-badge">{badge}</span> : null}
      </header>
      <div className="form-grid">{children}</div>
    </fieldset>
  );
}
