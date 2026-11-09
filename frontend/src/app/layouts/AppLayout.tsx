import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { to: "/beneficiarias", label: "Beneficiarias" },
  { to: "/fichas/nueva", label: "Nueva ficha inicial" },
  { to: "/fichas/borradores", label: "Borradores" },
  { to: "/fichas/confirmadas", label: "Fichas confirmadas" },
  { to: "/albergue", label: "Albergue" },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Ir al inicio">
          <span className="brand-mark" aria-hidden="true">NH</span>
          <span>Asociación Nuevos Horizontes</span>
        </a>
        <span className="environment-badge">Entorno de desarrollo</span>
      </header>
      <aside className="app-sidebar" aria-label="Navegación principal">
        <nav>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="app-main" id="contenido-principal">
        <Outlet />
      </main>
    </div>
  );
}
