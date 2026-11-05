import { api } from "../shared/api/persona3";
import { useConsulta } from "../modules/persona3/useConsulta";
import {
  BeneficiariaContext,
  AreaFichaContext,
} from "../modules/persona3/contexto";
import { ErrorVista } from "../shared/components/feedback";
import { lazy, Suspense, useState, useCallback } from "react";
import {
  createHashRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  NavLink,
  Link,
  Outlet,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Cargando } from "../shared/components/feedback";
import type { Capacidades } from "../shared/types/api";
import { soloLectura } from "../shared/types/api";
import { Beneficiarias, Expediente } from "./Expediente";
import { navegacionMockup } from "./navegacion";
import { CapacidadesContext } from "./capacidades";
const Listado = lazy(() =>
  import("../modules/persona3/Listados").then((m) => ({
    default: m.ListadoFichas,
  })),
);
const Guarderia = lazy(() =>
  import("../modules/persona3/Listados").then((m) => ({
    default: m.Guarderia,
  })),
);
const Editor = lazy(() =>
  import("../modules/persona3/EditorFicha").then((m) => ({
    default: m.EditorFicha,
  })),
);
const Evolucion = lazy(() =>
  import("../modules/persona3/Evolucion").then((m) => ({
    default: m.Evolucion,
  })),
);
function Contexto() {
  const { beneficiariaId = "" } = useParams();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const [areaFicha, setAreaFicha] = useState("");
  const base = `/beneficiarias/${beneficiariaId}`;
  const q = useConsulta(
    useCallback(
      (signal: AbortSignal) =>
        beneficiariaId
          ? api.beneficiaria(beneficiariaId, signal)
          : Promise.resolve(undefined),
      [beneficiariaId],
    ),
  );
  const area = location.pathname.includes("/social")
    ? "Trabajo Social"
    : location.pathname.includes("/guarderia")
      ? "Guardería"
      : location.pathname.includes("/legal") ||
          location.pathname.includes("/referencias")
        ? "Área Legal"
        : location.pathname.includes("/evolucion")
          ? "Hoja evolutiva"
          : location.pathname.includes("/fichas/")
            ? areaFicha || "Ficha del área"
            : "Gestión de beneficiarias";

  return (
    <AreaFichaContext.Provider
      value={{ area: areaFicha, setArea: setAreaFicha }}
    >
      <BeneficiariaContext.Provider value={q.datos}>
        <header className="top">
          <Link className="brand" to="/">
            <span className="logo">NH</span>
            <span>
              <strong>Nuevos Horizontes</strong>
              <small>Gestión de beneficiarias</small>
            </span>
          </Link>
          <div className="top-context">
            {area} / {beneficiariaId ? "Expediente" : "Beneficiarias"}
          </div>
          <div className="user">
            <span className="avatar">NH</span>
            <span>
              <strong>
                {import.meta.env.DEV ? "Sesión local" : "Personal autorizado"}
              </strong>
              <small>
                {import.meta.env.DEV
                  ? "Capacidades de prueba"
                  : "Atención institucional"}
              </small>
            </span>
          </div>
          <button
            className="menu-toggle"
            aria-expanded={menu}
            aria-controls="navegacion-principal"
            onClick={() => setMenu(!menu)}
          >
            Menú
          </button>
        </header>
        <aside className={"side " + (menu ? "open" : "")}>
          <p className="side-label">NAVEGACIÓN</p>
          <nav id="navegacion-principal" aria-label="Navegación institucional">
            {navegacionMockup(area, base).map((item) =>
              item.to ? (
                <NavLink
                  key={item.label}
                  end
                  to={item.to}
                  className={({ isActive }) =>
                    isActive || item.actual ? "active" : undefined
                  }
                  onClick={() => setMenu(false)}
                >
                  <span aria-hidden="true">{item.icono}</span>
                  {item.label}
                </NavLink>
              ) : (
                <button key={item.label} disabled>
                  <span aria-hidden="true">{item.icono}</span>
                  {item.label}
                </button>
              ),
            )}
          </nav>
          <div className="privacy">
            <strong>
              {area === "Gestión de beneficiarias"
                ? "Datos generales"
                : "Área protegida"}
            </strong>
            {area === "Gestión de beneficiarias"
              ? "Consulta los datos básicos autorizados y el expediente de la beneficiaria."
              : "La información pertenece al expediente y al área de atención."}
          </div>
        </aside>
        <main id="contenido" tabIndex={-1}>
          <div className="wrap">
            <div className="crumb">
              <Link to="/beneficiarias">Beneficiarias</Link> /{" "}
              {beneficiariaId && (
                <>{q.datos?.nombre || `Expediente ${beneficiariaId}`} / </>
              )}
              <b>{area}</b>
            </div>
            {!!q.error && (
              <ErrorVista error={q.error} reintentar={q.recargar} />
            )}
            <Suspense fallback={<Cargando />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </BeneficiariaContext.Provider>
    </AreaFichaContext.Provider>
  );
}
const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Navigate to="/beneficiarias" replace />} />
      <Route path="/beneficiarias" element={<Contexto />}>
        <Route index element={<Beneficiarias />} />
      </Route>
      <Route path="/beneficiarias/:beneficiariaId" element={<Contexto />}>
        <Route index element={<Expediente />} />
        <Route path="social" element={<Listado area="trabajo-social" />} />
        <Route path="social/nueva" element={<Editor nueva />} />
        <Route path="legal" element={<Listado area="legal" />} />
        <Route path="fichas/:fichaId" element={<Editor />} />
        <Route path="referencias" element={<Listado area="referencias" />} />
        <Route
          path="referencias/nueva"
          element={<Editor esReferencia nueva />}
        />
        <Route path="referencias/:fichaId" element={<Editor esReferencia />} />
        <Route path="guarderia" element={<Guarderia />} />
        <Route
          path="guarderia/:hijoId"
          element={<Listado area="guarderia" />}
        />
        <Route path="evolucion" element={<Evolucion />} />
      </Route>
      <Route
        path="*"
        element={
          <main>
            <h1>Página no encontrada</h1>
            <Link to="/">Volver al inicio</Link>
          </main>
        }
      />
    </>,
  ),
);
export function App({
  capacidades = soloLectura,
}: {
  capacidades?: Capacidades;
}) {
  return (
    <CapacidadesContext.Provider value={capacidades}>
      <a
        className="skip"
        href="#contenido"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("contenido")?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <RouterProvider router={router} />
    </CapacidadesContext.Provider>
  );
}
