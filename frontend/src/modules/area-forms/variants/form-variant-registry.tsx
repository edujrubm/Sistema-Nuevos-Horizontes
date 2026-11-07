import type { ComponentType } from "react";

import type { ClinicalVariantCode } from "./clinical-variant-contract";

export interface FormVariantValue {
  detail: Record<string, unknown>;
  mentalExam: Record<string, unknown> | null;
}

export interface FormVariantFieldError {
  field: string;
  message: string;
}

export interface FormVariantComponentProps {
  value: FormVariantValue;
  errors: readonly FormVariantFieldError[];
  readOnly: boolean;
  onChange: (value: FormVariantValue) => void;
}

export interface FormVariantRegistration {
  code: ClinicalVariantCode;
  component: ComponentType<FormVariantComponentProps>;
}

export interface FormVariantRegistry {
  resolve: (
    code: string,
  ) => ComponentType<FormVariantComponentProps> | undefined;
  has: (code: string) => code is ClinicalVariantCode;
  codes: () => ClinicalVariantCode[];
}

export function createFormVariantRegistry(
  registrations: readonly FormVariantRegistration[],
): FormVariantRegistry {
  const components = new Map<
    ClinicalVariantCode,
    ComponentType<FormVariantComponentProps>
  >();

  for (const registration of registrations) {
    if (components.has(registration.code)) {
      throw new Error(
        `La variante ${registration.code} está registrada más de una vez.`,
      );
    }
    components.set(registration.code, registration.component);
  }

  return Object.freeze({
    resolve(code: string) {
      return components.get(code as ClinicalVariantCode);
    },
    has(code: string): code is ClinicalVariantCode {
      return components.has(code as ClinicalVariantCode);
    },
    codes() {
      return [...components.keys()];
    },
  });
}

interface FormVariantRendererProps extends FormVariantComponentProps {
  type: string;
  registry: FormVariantRegistry;
  onUnsupported?: () => void;
}

export function FormVariantRenderer({
  type,
  registry,
  onUnsupported,
  ...componentProps
}: FormVariantRendererProps) {
  const Component = registry.resolve(type);

  if (!Component) {
    return (
      <section className="alert warning" role="alert">
        <strong>Tipo de formulario no disponible</strong>
        <span>
          Esta variante no tiene un componente frontend registrado. No se
          mostraron campos para evitar editar un contrato desconocido.
        </span>
        {onUnsupported ? (
          <div>
            <button
              className="button secondary"
              type="button"
              onClick={onUnsupported}
            >
              Volver al listado
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  return <Component {...componentProps} />;
}
