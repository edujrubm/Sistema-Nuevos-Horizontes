import type { ReactNode } from "react";
import {
  FormProgressSummary,
  FormStepNavigation,
  type FormStep,
} from "@/shared/components/forms";

/** Navegación y progreso comunes con Medicina y Psicología, sin enlaces entre áreas. */
export function MarcoFicha({
  paginas,
  pagina,
  cambiar,
  children,
}: {
  paginas: { titulo: string; tarjeta: string; campos: string[] }[];
  pagina: number;
  cambiar: (page: number) => void;
  children: ReactNode;
}) {
  const steps: FormStep[] = paginas.map((section, index) => ({
    id: String(index),
    label: section.titulo,
    status:
      index === pagina ? "current" : index < pagina ? "complete" : "pending",
  }));
  return (
    <>
      <FormStepNavigation
        numberedLabels
        steps={steps}
        onStepChange={(id) => cambiar(Number(id))}
        label="Secciones de la ficha"
      />
      <div className="clinical-variant-layout">
        <div>{children}</div>
        <FormProgressSummary steps={steps} />
      </div>
    </>
  );
}
