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
  const legal = useMatch("/beneficiarias/:id/legal/*");
  const references = useMatch("/beneficiarias/:id/referencias/*");
  const social = useMatch("/beneficiarias/:id/social/*");
  const guarderia = useMatch("/beneficiarias/:id/guarderia/*");
  const areaModule = social ?? guarderia;
  const areaPath = guarderia ? "guarderia" : "social";
  const legalCaseId = legal?.params.id ?? references?.params.id;
  const albergue = location.pathname.startsWith("/albergue");
  const links = albergue
    ? shelterNavigation
    : areaModule
      ? [
          { to: "/beneficiarias", label: "Beneficiarias" },
          { to: `/beneficiarias/${areaModule.params.id}`, label: "Expediente" },
          {
            to: `/beneficiarias/${areaModule.params.id}/${areaPath}`,
            label: guarderia ? "Fichas de Guardería" : "Ficha social",
          },
          {
            to: `/beneficiarias/${areaModule.params.id}/evolucion`,
            label: "Seguimiento y hoja evolutiva",
          },
          {
            to: `/beneficiarias/${areaModule.params.id}/documentos`,
            label: "Documentos",
          },
        ]
      : legalCaseId
        ? [
            { to: "/beneficiarias", label: "Beneficiarias" },
            { to: `/beneficiarias/${legalCaseId}`, label: "Expediente" },
            { to: `/beneficiarias/${legalCaseId}/legal`, label: "Ficha Legal" },
            {
              to: `/beneficiarias/${legalCaseId}/referencias`,
              label: "Referencias legales",
            },
            {
              to: `/beneficiarias/${legalCaseId}/evolucion`,
              label: "Hoja evolutiva",
            },
            {
              to: `/beneficiarias/${legalCaseId}/documentos`,
              label: "Documentos",
            },
          ]
        : documentos
          ? [
              { to: "/beneficiarias", label: "Beneficiarias" },
              {
                to: `/beneficiarias/${documentos.params.id}`,
                label: "Expediente",
              },
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
    : areaModule
      ? guarderia
        ? "Guardería"
        : "Trabajo Social"
      : legalCaseId
        ? "Área Legal"
        : documentos
          ? "Módulo de Documentos"
          : "Admisión y ficha inicial";
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link
          className="brand"
          to={moduleHome}
          aria-label={`Ir al inicio de ${moduleLabel}`}
        >
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
              end={
                !(
                  (areaModule && item.to.endsWith("/" + areaPath)) ||
                  (legalCaseId &&
                    (item.to.endsWith("/legal") ||
                      item.to.endsWith("/referencias")))
                )
              }
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
