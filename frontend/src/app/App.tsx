import { lazy, Suspense, useState } from "react";
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
  const base = `/beneficiarias/${beneficiariaId}`;
  return (
    <>
      <aside>
        <Link className="brand" to="/">
          NH <span>Nuevos Horizontes</span>
        </Link>
        <p className="eyebrow">Expediente · {beneficiariaId}</p>
        <nav aria-label="Áreas de atención">
          {[
            ["", "Expediente"],
            ["/social", "Trabajo Social"],
            ["/legal", "Legal"],
            ["/referencias", "Referencias legales"],
            ["/guarderia", "Guardería"],
            ["/evolucion", "Hoja evolutiva"],
          ].map(([ruta, texto]) => (
            <NavLink key={ruta} end to={base + ruta}>
              {texto}
            </NavLink>
          ))}
        </nav>
        <Link to="/">Cambiar expediente</Link>
      </aside>
      <main id="contenido" tabIndex={-1}>
        <header>
          <Link to={base}>← Volver al expediente</Link>
          <span>Atención institucional</span>
        </header>
        <Suspense fallback={<Cargando />}>
          <Outlet />
        </Suspense>
      </main>
    </>
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
