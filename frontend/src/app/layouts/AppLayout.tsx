import { Link, NavLink, Outlet, useLocation, useMatch } from "react-router-dom";

const admissionNavigation = [
  { to: "/beneficiarias", label: "Beneficiarias" },
  { to: "/fichas/nueva", label: "Nueva ficha inicial" },
  { to: "/fichas/borradores", label: "Borradores" },
  { to: "/fichas/confirmadas", label: "Fichas confirmadas" },
];

const shelterNavigation = [
  { to: "/albergue", label: "Concurrencia" },
  { to: "/albergue/ingreso", label: "Registrar ingreso" },
  { to: "/albergue/movimientos", label: "Salidas y retornos" },
  { to: "/albergue/cierres", label: "Egreso y nacimiento" },
  { to: "/albergue/historial", label: "Historial" },
];

export function AppLayout() {
  const location = useLocation();
  const documentos = useMatch("/beneficiarias/:id/documentos");
  const albergue = location.pathname.startsWith("/albergue");
  const links = albergue
    ? shelterNavigation
    : documentos
      ? [
          { to: "/beneficiarias", label: "Beneficiarias" },
          { to: `/beneficiarias/${documentos.params.id}`, label: "Expediente" },
          {
            to: `/beneficiarias/${documentos.params.id}/evolucion`,
            label: "Hoja evolutiva",
          },
          { to: location.pathname, label: "Documentos" },
        ]
      : admissionNavigation;
  const moduleHome = albergue ? "/albergue" : "/beneficiarias";
  const moduleLabel = albergue
    ? "Módulo de Albergue"
    : documentos
      ? "Módulo de Documentos"
      : "Admisión y ficha inicial";
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="brand" to={moduleHome} aria-label={`Ir al inicio de ${moduleLabel}`}>
          <span className="brand-mark" aria-hidden="true">
            NH
          </span>
          <span>Asociación Nuevos Horizontes</span>
        </Link>
        <span className="environment-badge">Entorno de desarrollo</span>
      </header>
      <aside className="app-sidebar" aria-label="Navegación principal">
        <p className="sidebar-module-label">{moduleLabel}</p>
        <nav>
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {documentos && (
          <p className="sidebar-note">
            <strong>Propiedad del área</strong>
            <br />
            El personal consulta únicamente documentos autorizados de su área.
          </p>
        )}
      </aside>
      <main className="app-main" id="contenido-principal">
        <Outlet />
      </main>
    </div>
  );
}
