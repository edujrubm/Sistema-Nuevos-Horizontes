import { useCallback, useState } from "react";
import { Link, Outlet, useParams, useLocation } from "react-router-dom";
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
  const base = `/beneficiarias/${beneficiariaId}`;
  const location = useLocation();
  const legal = /^\/beneficiarias\/[^/]+\/(legal|referencias)(\/|$)/.test(
    location.pathname,
  );
  return (
    <CapacidadesContext.Provider value={capacidades}>
      <AreaFichaContext.Provider value={{ area, setArea }}>
        <BeneficiariaContext.Provider value={q.datos}>
          <div className="area-records">
            {!legal &&
              !/^\/beneficiarias\/[^/]+\/social(\/|$)/.test(
                location.pathname,
              ) && (
                <nav aria-label="Áreas del expediente" className="tabs">
                  <Link to={base}>Expediente</Link>{" "}
                  <Link to={`${base}/social`}>Trabajo Social</Link>{" "}
                  <Link to={`${base}/legal`}>Legal</Link>{" "}
                  <Link to={`${base}/referencias`}>Referencias</Link>{" "}
                  <Link to={`${base}/guarderia`}>Guardería</Link>{" "}
                  <Link to={`${base}/evolucion`}>Evolución</Link>
                  <Link to={`${base}/documentos`}>Documentos</Link>
                </nav>
              )}
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
