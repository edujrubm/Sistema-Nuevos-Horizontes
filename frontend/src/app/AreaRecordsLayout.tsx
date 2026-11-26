import { useCallback, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { api } from "../shared/api/area-records";
import { useConsulta } from "../shared/hooks/useConsulta";
import {
  BeneficiariaContext,
  AreaFichaContext,
} from "../shared/context/area-record-context";
import { CapacidadesContext } from "./capacidades";
import { soloLectura } from "../shared/types/api";
import { ErrorVista } from "../shared/components/feedback";
import "../styles/tokens.css";
const capacidades =
  import.meta.env.DEV && import.meta.env.VITE_DEV_CAPABILITIES === "true"
    ? {
        crearFicha: true,
        editarFicha: true,
        confirmarFicha: true,
        crearReferencia: true,
        corregirReferencia: true,
        crearEvolucion: true,
        corregirEvolucion: true,
        verRevisiones: true,
      }
    : soloLectura;
export function AreaRecordsLayout() {
  const { beneficiariaId = "" } = useParams();
  const [area, setArea] = useState("");
  const q = useConsulta(
    useCallback(
      (signal: AbortSignal) => api.beneficiaria(beneficiariaId, signal),
      [beneficiariaId],
    ),
  );
  return (
    <CapacidadesContext.Provider value={capacidades}>
      <AreaFichaContext.Provider value={{ area, setArea }}>
        <BeneficiariaContext.Provider value={q.datos}>
          <div className="area-records">
            {!!q.error && (
              <ErrorVista error={q.error} reintentar={q.recargar} />
            )}
            <Outlet />
          </div>
        </BeneficiariaContext.Provider>
      </AreaFichaContext.Provider>
    </CapacidadesContext.Provider>
  );
}
