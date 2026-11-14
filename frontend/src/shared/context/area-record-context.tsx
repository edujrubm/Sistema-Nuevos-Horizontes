import { createContext, useContext } from "react";
import type { api } from "../api/area-records";
export type BeneficiariaContexto = Awaited<ReturnType<typeof api.beneficiaria>>;
export const BeneficiariaContext = createContext<
  BeneficiariaContexto | undefined
>(undefined);
export const useBeneficiaria = () => useContext(BeneficiariaContext);

import { Link, useParams } from "react-router-dom";
export function BarraBeneficiaria() {
  const b = useBeneficiaria();
  const { beneficiariaId = "" } = useParams();
  const iniciales =
    (b?.nombre || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("") || "—";
  return (
    <section className="person">
      <span className="person-mark">{iniciales}</span>
      <div>
        <strong>{b?.nombre || `Beneficiaria ${beneficiariaId}`}</strong>
        <small>
          Expediente {beneficiariaId} ·{" "}
          {b?.cuiEnmascarado
            ? `DPI/CUI ${b.cuiEnmascarado}`
            : "DPI/CUI protegido"}
        </small>
      </div>
      <Link className="button secondary" to="/">
        Seleccionar beneficiaria
      </Link>
    </section>
  );
}

export const AreaFichaContext = createContext<{
  area: string;
  setArea: (area: string) => void;
}>({ area: "", setArea: () => {} });
export const useAreaFicha = () => useContext(AreaFichaContext);
