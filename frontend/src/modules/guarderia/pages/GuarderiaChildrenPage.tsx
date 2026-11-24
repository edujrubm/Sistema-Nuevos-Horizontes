import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import {
  BarraBeneficiaria,
  useAreaFicha,
} from "@/shared/context/area-record-context";
import { consultaDesdeQuery } from "@/shared/api/query-result";
import { Cargando, ErrorVista, Paginacion } from "@/shared/components/feedback";
import { PestañasArea } from "@/modules/area-forms/components";
import { guarderiaApi } from "../api/guarderia-api";

export function GuarderiaChildrenPage() {
  const { beneficiariaId = "" } = useParams();
  const [page, setPage] = useState(1);
  const caps = useCapacidades();
  const { setArea } = useAreaFicha();
  useEffect(() => {
    setArea("Guardería");
    return () => setArea("");
  }, [setArea]);
  const query = consultaDesdeQuery(
    useQuery({
      queryKey: ["guarderia", "beneficiaria", beneficiariaId, "hijos", page],
      queryFn: ({ signal }) =>
        guarderiaApi.children(beneficiariaId, page, signal),
      enabled: Boolean(true),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const base = `/beneficiarias/${beneficiariaId}/guarderia`;
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Guardería</p>
          <h1>Ficha de Guardería</h1>
        </div>
      </header>
      <BarraBeneficiaria />
      <PestañasArea beneficiariaId={beneficiariaId} area="GUARDERIA" />
      {query.cargando ? (
        <Cargando />
      ) : query.error ? (
        <ErrorVista error={query.error} reintentar={query.recargar} />
      ) : (
        <section className="card">
          <h2>Hijas e hijos del expediente</h2>
          {!query.datos?.datos.length ? (
            <p className="empty">No hay hijas o hijos registrados.</p>
          ) : (
            <ul className="rows">
              {query.datos.datos.map((child) => (
                <li key={child.ninoId}>
                  <div>
                    <strong>{child.nombre}</strong>
                    <small>
                      {child.inscrito
                        ? "Inscripción confirmada"
                        : "Sin inscripción confirmada"}
                    </small>
                  </div>
                  <div className="actions">
                    {child.inscrito && (
                      <Link to={`${base}/${child.ninoId}?paginaHijos=${page}`}>
                        Ver fichas
                      </Link>
                    )}
                    {caps.crearFicha && (
                      <Link
                        className="button secondary"
                        to={`${base}/nueva?ninoId=${child.ninoId}&paginaHijos=${page}`}
                      >
                        Crear ficha
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {query.datos && <Paginacion {...query.datos} cambiar={setPage} />}
        </section>
      )}
    </>
  );
}
