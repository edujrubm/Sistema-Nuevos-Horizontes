import { NavLink, Outlet, useLocation, useMatch } from "react-router-dom";

const navigation = [
  { to: "/beneficiarias", label: "Beneficiarias" },
  { to: "/fichas/nueva", label: "Nueva ficha inicial" },
  { to: "/fichas/borradores", label: "Borradores" },
  { to: "/fichas/confirmadas", label: "Fichas confirmadas" },
  { to: "/albergue", label: "Albergue" },
  { to: "/albergue/movimientos", label: "Salidas y retornos" },
  { to: "/albergue/cierres", label: "Egreso y nacimiento" },
  { to: "/albergue/historial", label: "Historial de movimientos" },
];

export function AppLayout() {
  const location = useLocation();
  const documentos = useMatch("/beneficiarias/:id/documentos");
  const albergue = location.pathname.startsWith("/albergue");
  const links = albergue
    ? [
        { to: "/beneficiarias", label: "Inicio" },
        { to: "/albergue", label: "Concurrencia" },
        { to: "/albergue/movimientos", label: "Salidas y retornos" },
        { to: "/albergue/historial", label: "Historial" },
        { to: "/albergue/cierres", label: "Egreso y nacimiento" },
      ]
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
      : navigation;
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Ir al inicio">
          <span className="brand-mark" aria-hidden="true">
            NH
          </span>
          <span>Asociación Nuevos Horizontes</span>
        </a>
        <span className="environment-badge">Entorno de desarrollo</span>
      </header>
      <aside className="app-sidebar" aria-label="Navegación principal">
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
