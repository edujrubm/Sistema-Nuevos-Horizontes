import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface FieldFrameProps {
  id?: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: (accessibility: {
    id: string;
    describedBy?: string;
    invalid: boolean;
  }) => ReactNode;
}

function FieldFrame({
  id: providedId,
  label,
  required = false,
  hint,
  error,
  className = "",
  children,
}: FieldFrameProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? (
          <span className="required-marker" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obligatorio)</span> : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="field-error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  type?:
    | "text"
    | "date"
    | "datetime-local"
    | "number"
    | "email"
    | "tel";
}

export function TextField({
  label,
  hint,
  error,
  fullWidth = false,
  id,
  required,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fullWidth ? "full" : ""}
    >
      {(accessibility) => (
        <input
          {...inputProps}
          id={accessibility.id}
          type={type}
          required={required}
          aria-invalid={accessibility.invalid || undefined}
          aria-describedby={accessibility.describedBy}
        />
      )}
    </FieldFrame>
  );
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export function SelectField({
  label,
  hint,
  error,
  fullWidth = false,
  id,
  required,
  children,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fullWidth ? "full" : ""}
    >
      {(accessibility) => (
        <select
          {...selectProps}
          id={accessibility.id}
          required={required}
          aria-invalid={accessibility.invalid || undefined}
          aria-describedby={accessibility.describedBy}
        >
          {children}
        </select>
      )}
    </FieldFrame>
  );
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export function TextAreaField({
  label,
  hint,
  error,
  fullWidth = false,
  id,
  required,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fullWidth ? "full" : ""}
    >
      {(accessibility) => (
        <textarea
          {...textareaProps}
          id={accessibility.id}
          required={required}
          aria-invalid={accessibility.invalid || undefined}
          aria-describedby={accessibility.describedBy}
        />
      )}
    </FieldFrame>
  );
}
