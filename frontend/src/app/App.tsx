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
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Cargando } from "../shared/components/feedback";
import type { Capacidades } from "../shared/types/api";
import { soloLectura } from "../shared/types/api";
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
      (signal: AbortSignal) => api.beneficiaria(beneficiariaId, signal),
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
          <div className="top-context">{area} / Expediente</div>
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
          <nav id="navegacion-principal" aria-label="Áreas de atención">
            {[
              ["", "⌕", "Beneficiarias"],
              ["/social", "◉", "Trabajo Social"],
              ["/legal", "◉", "Área Legal"],
              ["/guarderia", "◉", "Guardería"],
              ["/referencias", "↗", "Referencias legales"],
              ["/evolucion", "≡", "Hoja evolutiva"],
            ].map(([ruta, icono, texto]) => (
              <NavLink
                key={ruta}
                end
                className={({ isActive }) =>
                  isActive ||
                  (location.pathname.includes("/fichas/") &&
                    ((areaFicha === "Área Legal" && ruta === "/legal") ||
                      (areaFicha === "Trabajo Social" && ruta === "/social") ||
                      (areaFicha === "Guardería" && ruta === "/guarderia")))
                    ? "active"
                    : undefined
                }
                to={base + ruta}
                onClick={() => setMenu(false)}
              >
                <span aria-hidden="true">{icono}</span>
                {texto}
              </NavLink>
            ))}
            <button disabled title="Módulo documental pendiente de integración">
              <span aria-hidden="true">▤</span>Documentos
            </button>
            <button disabled title="Reportes fuera del alcance de esta entrega">
              <span aria-hidden="true">▦</span>Reportes
            </button>
          </nav>
          <div className="privacy">
            <strong>Privacidad por área</strong>La información pertenece al
            expediente y al área de atención.
          </div>
        </aside>
        <main id="contenido" tabIndex={-1}>
          <div className="wrap">
            <div className="crumb">
              <Link to={base}>Beneficiarias</Link> /{" "}
              {q.datos?.nombre || `Expediente ${beneficiariaId}`} /{" "}
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
function Inicio() {
  const [id, setId] = useState("");
  const navigate = useNavigate();
  return (
    <main className="welcome">
      <p className="eyebrow">Asociación Nuevos Horizontes</p>
      <h1>Atención por área</h1>
      <p>Trabajo Social, Legal, Guardería y seguimiento.</p>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/beneficiarias/${id}`);
        }}
      >
        <label>
          Identificador de la beneficiaria
          <input
            required
            pattern="[1-9][0-9]*"
            maxLength={19}
            value={id}
            onChange={(e) => setId(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <button className="primary">Abrir expediente</button>
      </form>
    </main>
  );
}
function Expediente() {
  const { beneficiariaId } = useParams();
  return (
    <>
      <p className="eyebrow">Expediente {beneficiariaId}</p>
      <h1>Continuar la atención</h1>
      <p>
        Selecciona un área para consultar sus fichas y registrar el seguimiento
        autorizado.
      </p>
      <div className="cards">
        {[
          [
            "social",
            "Trabajo Social",
            "Resumen, diagnóstico y plan de intervención.",
          ],
          ["legal", "Legal", "Consulta de fichas y estado de la atención."],
          ["guarderia", "Guardería", "Niñas y niños inscritos y sus fichas."],
          [
            "evolucion",
            "Hoja evolutiva",
            "Atenciones y revisiones de tu área.",
          ],
        ].map(([ruta, titulo, texto]) => (
          <Link className="card nav-card" key={ruta} to={ruta}>
            <h2>{titulo}</h2>
            <p>{texto}</p>
            <span>Abrir área →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Inicio />} />
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
